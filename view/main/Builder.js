Ext.define('GuiBuilder.view.main.Builder', {
  defaultListenerScope: true,
  extend: 'Ext.form.FieldContainer',
  initComponent: function () {
    this.callParent();
    this.comps = [];
    this.compId = 0;
  },
  addArgument: function (el, event) {
    var dom = el.dom;
    var index = Number(dom.dataset.currentindex);
    var slot = this.createNode('path', {
      deletable: 'remove',
      editable: true,
      index: index,
      placeholder: dom.dataset.placeholder
    });
    // if (index !== 0) {
    //   slot = dom.dataset.join + slot;
    // }
    dom.parentElement.insertBefore(slot, dom);
    dom.dataset.currentindex = '' + (index + 1);
  },
  createElement: function (html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.childNodes[0];
  },
  createElements: function (html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return Ext.Array.from(div.childNodes);
  },
  createFragment: function (type, config) {
    var span = ['span'];
    var innerFragment = this.createInnerFragment(type, config);
    Ext.Object.each(Ext.apply({
      fn: 'focusInner',
    }, config), function (key, value) {
      if (value !== undefined && key !== 'inner') {
        span.push('data-' + key + '="' + value + '"');
      }
    });
    span.push(
      'class="gb-wrap gb-action gb-' + type + '"',
      'contenteditable="false"'
    );
    return '<' + span.join(' ') + '>' + innerFragment + '</span>';
  },
  createNode: function (type, config) {
    return this.createElement(this.createFragment(type, config));
  },
  createInnerFragment: function (type, config) {
    var str = '&#8203;';
    var isEmpty = type === 'empty';
    if (!config.static) {
      str += '<span data-fn="switchType" class="gb-action gb-switch-action x-fa fa-chevron-circle-down"></span>&#8203;';
    }
    if (!isEmpty) {
      str += '<span contenteditable="' + (config.editable || 'false') + '" class="gb-inner"' + (config.placeholder ? ' data-gb-placeholder="' + config.placeholder + '"' : '') + '>' + (config.inner || '') + '</span>';
    }
    str += '&#8203;';
    if (config.deletable && !isEmpty) {
      str += '<span data-fn="deleteArgument" data-deletetype="' + config.deletable + '" class="gb-action gb-delete-action x-fa fa-times-circle"></span>&#8203;';
    }
    return str;
  },
  deleteArgument: function (el) {
    var dom = el.dom;
    if (dom.dataset.deletetype === 'remove') {
      var slot = el.up('.gb-wrap');
      var addButton = slot
        .up('.gb-wrap')
        .down('.gb-action-add');
      var currentIndex = Number(addButton.dom.dataset.currentindex);
      // if (currentIndex > 1) {
      //   (Number(slot.dom.dataset.index) === 0 ? slot.dom.nextSibling : slot.dom.previousSibling).remove();
      // }
      var sibling = slot.dom.nextSibling;
      while (sibling) {
        if (sibling.dataset && sibling.dataset.index) {
          sibling.dataset.index = (Number(sibling.dataset.index) - 1) + '';
        }
        sibling = sibling.nextSibling;
      }
      slot.dom.remove();
      addButton.dom.dataset.currentindex = '' + (currentIndex - 1);
    } else {
      this.focused = el;
      this.handleSelect({ definition: { type: 'empty' } });
    }
  },
  focusInner: function (el) {
    var inner = el.down('.gb-inner');
    // function onBlur () {
    //   inner.removeCls('gb-active');
    //   inner.removeListener('blur', onBlur);
    // }
    // inner.addCls('gb-active');
    // inner.addListener('blur', onBlur);
    inner.dom.focus();
  },
  getSlot: function (args, index, join) {
    if (index === '_' || index === '?') {
      return this.createFragment('block', {
        editable: true,
        index: index,
        static: true
      });
    }
    var slot = args[index];
    // if (slot.enum) {
    //     return `<select data-index="${index}">${slot.enum.map(arg => `<option value="${arg}">${arg}</option>`)}</select>`;
    // }
    if (slot.name.startsWith('...')) {
      var minNumber = slot.minNumber || 0;
      var str = '';
      var i = 0
      var placeholder = slot.name.replace('...', '');
      for (; i < minNumber; i++) {
        // if (str) {
        //   str += join;
        // }
        str += this.createFragment('path', {
          index: index + i,
          editable: true,
          placeholder: placeholder
        });
      }
      str += '<span data-fn="addArgument" data-join="' + join + '" data-currentindex="' + i + '" data-placeholder="' + placeholder + '" class="gb-action gb-action-add x-fa fa-plus-circle"></span>';
      return str;
    }
    return this.createFragment('path', {
      deletable: slot.optional ? 'empty' : undefined,
      index: index,
      editable: true,
      placeholder: slot.name
    });
  },
  // html: [
  //   '<div class="gb-main" contenteditable style="border: 1px solid black; padding: 5px; line-height: 1.5; font-family: \'Lucida Console\', Monaco, monospace; position: absolute; left: 0; right: 78px;">',
  //   '</div>',
  //   '<div class="gb-action gb-mode-action gb-gui-mode gb-active-mode x-fa fa-code" data-fn="setModeGui"></div>',
  //   '<div class="gb-action gb-mode-action gb-text-mode x-fa fa-align-justify" data-fn="setModeText"></div>'
  // ],
  items: [{
    columnWidth: 1,
    html: '<div class="gb-main" contenteditable style="border: 1px solid black; padding: 5px; line-height: 1.5; font-family: \'Lucida Console\', Monaco, monospace;"></div>',
    // flex: 1,
    listeners: {
      render: 'onMainRender'
    },
    reference: 'main',
    xtype: 'box'
  }, {
    items: [{
      iconCls: 'x-fa fa-code',
      value: 'gui'
    }, {
      iconCls: 'x-fa fa-align-justify',
      value: 'text'
    }],
    listeners: [{
      change: 'onModeChange'
    }],
    reference: 'mode',
    value: 'gui',
    xtype: 'segmentedbutton'
  }],
  // layout: 'hbox',
  layout: 'column',
  onMainRender: function (main) {
    var el = main.getEl();
    el.on('keydown', function (e) {
      if (this.getMode() === 'text') {
        return;
      }
      if (e.keyCode === e.ENTER) {
        var target = Ext.fly(e.target);
        var isBlock = target.is('.gb-main') || target.is('.gb-block > .gb-inner');
        if (isBlock && e.shiftKey) {
          e.preventDefault();
          var sel, range;
          var node = this.createNode('path', {
            editable: true
          });
          sel = window.getSelection();
          if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();

            // Range.createContextualFragment() would be useful here but is
            // only relatively recently standardized and is not supported in
            // some browsers (IE9, for one)
            var frag = document.createDocumentFragment();
            frag.appendChild(node);
            range.insertNode(frag);
            this.switchType(Ext.fly(node).down('.gb-switch-action'));
            node.children[1].focus();
          }
        } else if (!isBlock) {
          e.preventDefault();
        }
      }
    }, this);
    el.on('click', function (e) {
      var dom = Ext.fly(e.target).findParent('.gb-action');
      if (dom) {
        var fn = dom.dataset.fn;
        this[fn](Ext.fly(dom), e);
      }
    }, this);
    el.on('resize', function (e) {
      this.setHeight(e.el.getHeight());
    }, this);
  },
  onModeChange: function (button, value) {
    var el = this.lookup('main').getEl();
    this._mode = value;
    if (!el) {
      return;
    }
    var str;
    if (value === 'text') {
      str = this.buildText(el.dom.firstChild);
      el.down('.gb-main').dom.innerText = str;
    } else {
      str = 'Coming soon...';
      el.down('.gb-main').dom.innerHTML = str;
    }
  },
  handleSelect: function (item) {
    var definition = item.definition;
    var block;
    var editable;
    var inner;
    var name;
    var placeholder;
    var type;
    if (definition.type === 'function') {
      type = 'fn';
      block = definition.block;
      name = definition.name;
      var join = definition.join || ', ';
      var returns = definition.returns;
      if (definition.display) {
        inner = definition.display.replace(/\{(_|\?|\d+)\}/g, function (match, idx) {
          return this.getSlot(definition.args, idx, join);
        }.bind(this));
      } else {
        inner = name + '(' + definition.args.map(function (arg, idx) {
          return this.getSlot(definition.args, idx, join);
        }.bind(this)).join(join) + ')';
      }
    } else if (definition.type === 'rawText') {
      editable = true;
      placeholder = 'text';
      type = 'text';
    } else if (definition.type === 'rawNumber') {
      // inner = '<span id="' + this.scheduleComp({
      //     width: 50,
      //     xtype: 'numberfield'
      //   }) + '"></span>';
      editable = true;
      placeholder = 'number';
      type = 'number';
    } else if (definition.type === 'empty') {
      type = 'empty';
    } else {
      editable = true;
      inner = definition.path;
      type = 'path';
    }
    var parent = this.focused.up('.gb-wrap');
    var config = Ext.merge({}, parent.dom.dataset, {
      block: block,
      editable: editable,
      inner: inner,
      name: name,
      placeholder: placeholder,
      returns: returns
    });
    var replacement = this.createNode(type, config);
    parent.dom.replaceWith(replacement);
    this.flushComps();
  },
  getMode: function () {
    return this._mode;
  },
  setMode: function (mode) {
    this.lookup('mode').setValue(mode);
  },
  switchType: function (el, event) {
    this.focused = el;
    var Data = GuiBuilder.view.main.Data;
    var items = [
      Data.buildData(),
      Data.buildFunctions()
    ];
    if (el.up('.gb-wrap').up('.gb-wrap')) {
      items.push({
        definition: {
          type: 'rawNumber'
        },
        listeners: {
          click: 'handleSelect'
        },
        text: 'Number'
      }, {
        definition: {
          type: 'rawText'
        },
        listeners: {
          click: 'handleSelect'
        },
        text: 'Text'
      });
    }
    this.add({
      constrainTo: document,
      items: items,
      xtype: 'menu'
    }).showAt(
      el.dom.offsetLeft + (el.getWidth() / 2),
      el.dom.offsetTop + el.getHeight()
    );
  },
  flushComps: function () {
    var comps = this.comps;
    while (comps.length > 0) {
      Ext.create(comps.shift());
    }
  },
  referenceHolder: true,
  scheduleComp: function (comp) {
    var id = this.getId() + '-gb-' + this.compId;
    this.compId++;
    this.comps.push(Ext.apply({
      renderTo: id
    }, comp));
    return id;
  },
  buildText: function (dom) {
    var str = '';
    dom.childNodes.forEach(function (node) {
      if (node.nodeName === 'SPAN') {
        str += '{{' + this.buildItem(node) + '}}';
      } else {
        str += node.textContent;
      }
    }.bind(this));
    return str;
  },
  buildFn: function (el) {
    var name = el.dom.dataset.name;
    var str = name;
    var isBlock = el.dom.dataset.block;
    var b1;
    var b2;
    var args = [];
    var inner = el.down('.gb-inner').dom;
    inner.childNodes.forEach(function (node) {
      var innerEl = Ext.fly(node);
      if (innerEl && innerEl.is('.gb-wrap')) {
        var index = innerEl.dom.dataset.index;
        switch (index) {
          case '_':
            b1 = this.buildText(innerEl.down('.gb-inner').dom);
            break;
          case '?':
            b2 = this.buildText(innerEl.down('.gb-inner').dom);
            break;
          default:
            args[index] = this.buildItem(node, true);
        }
      }
    }.bind(this));
    if (args.length > 0) {
      str += ' ' + args.join(' ');
    }
    if (isBlock) {
      str = '#' + str + '}}';
      if (b1) {
        str += b1;
      }
      if (b2) {
        str += '{{else}}' + b2;
      }
      str += '{{/' + name;
    }
    return str;
  },
  buildItem: function (slot, isNested) {
    var el = Ext.fly(slot);
    var inner = el.down('.gb-inner');
    if (el.is('.gb-path') || el.is('.gb-number')) {
      return inner.dom.innerText;
    } else if (el.is('.gb-fn')) {
      var left;
      var right;
      if (isNested) {
        left = '(';
        right = ')';
      } else {
        left = '';
        right = '';
      }
      return left + this.buildFn(el) + right;
    } else if (el.is('.gb-text')) {
      return '\'' + inner.dom.innerText.replace(/\\|'/, '\\$&') + '\'';
    }
    return '';
  },
  requires: [
    'GuiBuilder.view.main.Data'
  ],
  xtype: 'builder'
});