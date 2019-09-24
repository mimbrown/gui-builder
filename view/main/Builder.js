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
    var slot = this.createFragment({
      deletable: 'remove',
      editable: true,
      index: index,
      placeholder: dom.dataset.placeholder,
      type: 'path'
    });
    if (index !== 0) {
      slot = dom.dataset.join + slot;
    }
    this.createElements(slot).forEach(function (node) {
      dom.parentElement.insertBefore(node, dom);
    });
    dom.dataset.currentindex = '' + (index + 1);
  },
  createElements: function (html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return Ext.Array.from(div.childNodes);
  },
  createFragment: function (config) {
    var span = ['span'];
    var innerFragment = this.createInnerFragment(config);
    var type = config.type;
    delete config.type;
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
  createInnerFragment: function (config) {
    var str = '&#8203;';
    if (!config.static) {
      str += '<span data-fn="switchType" class="gb-action gb-switch-action x-fa fa-chevron-circle-down"></span>&#8203;';
    }
    str += '<span contenteditable="' + (config.editable || 'false') + '" class="gb-inner"' + (config.placeholder ? ' data-gb-placeholder="' + config.placeholder + '"' : '') + '>' + (config.inner || '') + '</span>&#8203;';
    if (config.deletable) {
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
      if (currentIndex > 1) {
        (Number(slot.dom.dataset.index) === 0 ? slot.dom.nextSibling : slot.dom.previousSibling).remove();
      }
      var sibling = slot.dom.nextSibling;
      while (sibling) {
        if (sibling.dataset && sibling.dataset.index) {
          sibling.dataset.index = (Number(sibling.dataset.index) - 1) + '';
        }
        sibling = sibling.nextSibling;
      }
      slot.dom.remove();
      addButton.dom.dataset.currentindex = '' + (currentIndex - 1);
    }
  },
  focusInner: function (el) {
    var inner = el.down('.gb-inner');
    function onBlur () {
      inner.removeCls('gb-active');
      inner.removeListener('blur', onBlur);
    }
    inner.addCls('gb-active');
    inner.addListener('blur', onBlur);
    inner.dom.focus();
  },
  getSlot: function (args, index, join) {
    if (index === '_' || index === '?') {
      return this.createFragment({
        editable: true,
        index: index,
        static: true,
        type: 'block'
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
        if (str) {
          str += join;
        }
        str += this.createFragment({
          index: index + i,
          editable: true,
          placeholder: placeholder,
          type: 'path'
        });
      }
      str += '<span data-fn="addArgument" data-join="' + join + '" data-currentindex="' + i + '" data-placeholder="' + placeholder + '" class="gb-action gb-action-add x-fa fa-plus-circle"></span>';
      return str;
    }
    return this.createFragment({
      index: index,
      editable: true,
      placeholder: slot.name,
      type: 'path'
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
          var innerHTML = this.createFragment({
            editable: true,
            type: 'path'
          });
          if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
              range = sel.getRangeAt(0);
              range.deleteContents();

              // Range.createContextualFragment() would be useful here but is
              // only relatively recently standardized and is not supported in
              // some browsers (IE9, for one)
              var el = document.createElement("div");
              // el.innerHTML = templates[0];
              el.innerHTML = innerHTML;
              var frag = document.createDocumentFragment(),
                node, lastNode;
              while ((node = el.firstChild)) {
                lastNode = frag.appendChild(node);
              }
              range.insertNode(frag);
              this.switchType(Ext.fly(lastNode).down('.gb-switch-action'));
              lastNode.children[1].focus();

              // Preserve the selection
              // if (lastNode) {
              //   range = range.cloneRange();
              //   range.setStartAfter(lastNode);
              //   range.collapse(true);
              //   sel.removeAllRanges();
              //   sel.addRange(range);
              // }
            }
          } else if (document.selection && document.selection.type != "Control") {
            // IE < 9
            document.selection.createRange().pasteHTML(innerHTML);
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
      if (definition.display) {
        inner = definition.display.replace(/\{(_|\?|\d+)\}/g, function (match, idx) {
          return this.getSlot(definition.args, idx)
        }.bind(this));
      } else {
        var join = definition.join || ', ';
        inner = '<span class="gb-returns gb-' + definition.returns + '"></span>' + name + '(' + definition.args.map(function (arg, idx) {
          return this.getSlot(definition.args, idx, join);
        }.bind(this)).join(join) + ')';
      }
    } else if (definition.type === 'rawText') {
      editable = true;
      placeholder = 'text';
      type = 'text';
    } else if (definition.type === 'rawNumber') {
      // inner = '<span id="' + this.scheduleComp({
      //   width: 50,
      //   xtype: 'numberfield'
      // }) + '"></span>';
      editable = true;
      placeholder = 'number';
      type = 'number';
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
      type: type
    });
    var replacement = this.createElements(this.createFragment(config))[0];
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
    // var items = [{
    //   menu: {
    //     defaults: {
    //       listeners: {
    //         click: {
    //           fn: handleSelect,
    //           scope: this
    //         }
    //       }
    //     },
    //     items: [{
    //       definition: {
    //         path: 'connectors',
    //         type: 'object'
    //       },
    //       menu: {
    //         defaults: {
    //           listeners: {
    //             click: {
    //               fn: handleSelect,
    //               scope: this
    //             }
    //           }
    //         },
    //         items: [{
    //           definition: {
    //             path: 'connectors.people',
    //             type: 'array'
    //           },
    //           text: 'people'
    //         }]
    //       },
    //       text: 'connectors'
    //     }, {
    //       menu: {
    //         defaults: {
    //           listeners: {
    //             click: {
    //               fn: handleSelect,
    //               scope: this
    //             }
    //           }
    //         },
    //         items: [{
    //           definition: {
    //             path: 'inputs.Date',
    //             type: 'object'
    //           },
    //           menu: {
    //             defaults: {
    //               listeners: {
    //                 click: {
    //                   fn: handleSelect,
    //                   scope: this
    //                 }
    //               }
    //             },
    //             items: [{
    //               definition: {
    //                 path: 'inputs.Date.end',
    //                 type: 'string'
    //               },
    //               text: 'end'
    //             }, {
    //               definition: {
    //                 path: 'inputs.Date.start',
    //                 type: 'string'
    //               },
    //               text: 'start'
    //             }, {
    //               definition: {
    //                 path: 'inputs.Date.value',
    //                 type: 'string'
    //               },
    //               text: 'value'
    //             }]
    //           },
    //           text: 'Date'
    //         }, {
    //           definition: {
    //             path: 'inputs.Name',
    //             type: 'object'
    //           },
    //           menu: {
    //             defaults: {
    //               listeners: {
    //                 click: {
    //                   fn: handleSelect,
    //                   scope: this
    //                 }
    //               }
    //             },
    //             items: [{
    //               definition: {
    //                 path: 'inputs.Name.first',
    //                 type: 'string'
    //               },
    //               text: 'first'
    //             }, {
    //               definition: {
    //                 path: 'inputs.Name.last',
    //                 type: 'string'
    //               },
    //               text: 'last'
    //             }]
    //           },
    //           text: 'Name'
    //         }]
    //       },
    //       text: 'inputs'
    //     }]
    //   },
    //   text: 'Data'
    // }, {
    //   menu: {
    //     items: [{
    //       menu: {
    //         defaults: {
    //           listeners: {
    //             click: {
    //               fn: handleSelect,
    //               scope: this
    //             }
    //           }
    //         },
    //         items: [{
    //           definition: {
    //             args: [{
    //               name: '...item',
    //               type: 'any'
    //             }],
    //             name: 'array',
    //             type: 'function'
    //           },
    //           text: 'Array'
    //         }]
    //       },
    //       text: 'Array'
    //     }, {
    //       menu: {
    //         defaults: {
    //           listeners: {
    //             click: {
    //               fn: handleSelect,
    //               scope: this
    //             }
    //           }
    //         },
    //         items: [{
    //           definition: {
    //             args: [{
    //               name: 'list',
    //               type: 'array'
    //             }],
    //             block: true,
    //             display: 'for each item in {0}, do {_}; else, do {?}',
    //             name: 'each',
    //             type: 'function'
    //           },
    //           text: 'Each'
    //         }, {
    //           definition: {
    //             args: [{
    //               name: 'boolean',
    //               type: 'any'
    //             }],
    //             block: true,
    //             display: 'if {0} then {_} otherwise {?}',
    //             name: 'if',
    //             type: 'function'
    //           },
    //           text: 'If'
    //         }]
    //       },
    //       text: 'Block'
    //     }, {
    //       menu: {
    //         defaults: {
    //           listeners: {
    //             click: {
    //               fn: handleSelect,
    //               scope: this
    //             }
    //           }
    //         },
    //         items: [{
    //           definition: {
    //             args: [{
    //               name: 'date',
    //               type: 'date'
    //             }, {
    //               enum: [
    //                 'day',
    //                 'month',
    //                 'year'
    //               ],
    //               name: 'type'
    //             }],
    //             // display: 'extract {1} from {0}',
    //             name: 'dateGet',
    //             returns: 'date',
    //             type: 'function'
    //           },
    //           text: 'Get Date'
    //         }]
    //       },
    //       text: 'Date'
    //     }, {
    //       menu: {
    //         defaults: {
    //           listeners: {
    //             click: {
    //               fn: handleSelect,
    //               scope: this
    //             }
    //           }
    //         },
    //         items: [{
    //           definition: {
    //             args: [{
    //               name: '...number',
    //               type: 'number'
    //             }],
    //             join: ' + ',
    //             name: 'sum',
    //             returns: 'number',
    //             type: 'function'
    //           },
    //           text: 'Sum'
    //         }]
    //       },
    //       text: 'Math'
    //     }]
    //   },
    //   text: 'Functions'
    // }];
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
    // Ext.create({
    var menu = this.add({
      constrainTo: document,
      items: items,
      xtype: 'menu'
    });
    // debugger
    menu.showAt(
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