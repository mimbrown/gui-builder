Ext.define('GuiBuilder.view.main.Data', {
    buildData: function () {
        return this.buildDataMenu(this.data, null, 'Data');
    },
    buildDataMenu: function (items, definition, text) {
        var ret = {
            definition: definition,
            text: text
        };
        if (items) {
            ret.menu = {
                defaults: {
                    listeners: {
                        click: 'handleSelect'
                    }
                },
                items: items.map(function (item) {
                    return this.buildDataMenu(item.items, item.definition, item.text);
                }.bind(this))
            };
        }
        return ret;
    },
    buildFunctions: function () {
        return this.buildDataMenu(this.functions, null, 'Functions');
    },
    data: [{
        definition: {
            path: 'connectors',
            type: 'object'
        },
        items: [{
            definition: {
                path: 'connectors.people',
                type: 'array'
            },
            text: 'people'
        }],
        text: 'connectors'
    }, {
        items: [{
            definition: {
                path: 'inputs.Date',
                type: 'object'
            },
            items: [{
                definition: {
                    path: 'inputs.Date.end',
                    type: 'string'
                },
                text: 'end'
            }, {
                definition: {
                    path: 'inputs.Date.start',
                    type: 'string'
                },
                text: 'start'
            }, {
                definition: {
                    path: 'inputs.Date.value',
                    type: 'string'
                },
                text: 'value'
            }],
            text: 'Date'
        }, {
            definition: {
                path: 'inputs.Name',
                type: 'object'
            },
            items: [{
                definition: {
                    path: 'inputs.Name.first',
                    type: 'string'
                },
                text: 'first'
            }, {
                definition: {
                    path: 'inputs.Name.last',
                    type: 'string'
                },
                text: 'last'
            }],
            text: 'Name'
        }],
        text: 'inputs'
    }],
    functions: [{
        items: [{
            definition: {
                args: [{
                    name: '...item',
                    type: 'any'
                }],
                name: 'array',
                type: 'function'
            },
            text: 'Array'
        }],
        text: 'Array'
    }, {
        items: [{
            definition: {
                args: [{
                    name: 'list',
                    type: 'array'
                }],
                block: true,
                display: 'for each item in {0}, do {_}; else, do {?}',
                name: 'each',
                type: 'function'
            },
            text: 'Each'
        }, {
            definition: {
                args: [{
                    name: 'boolean',
                    type: 'any'
                }],
                block: true,
                display: 'if {0} then {_} otherwise {?}',
                name: 'if',
                type: 'function'
            },
            text: 'If'
        }],
        text: 'Block'
    }, {
        items: [{
            definition: {
                args: [{
                    name: 'date',
                    type: 'date'
                }, {
                    enum: [
                        'day',
                        'month',
                        'year'
                    ],
                    name: 'type'
                }],
                // display: 'extract {1} from {0}',
                name: 'dateGet',
                returns: 'date',
                type: 'function'
            },
            text: 'Get Date'
        }, {
            definition: {
                args: [{
                    name: 'date',
                    type: 'date'
                }, {
                    name: 'format',
                    optional: true,
                    type: 'string'
                }],
                // display: 'extract {1} from {0}',
                name: 'format',
                returns: 'string',
                type: 'function'
            },
            text: 'Format'
        }],
        text: 'Date'
    }, {
        items: [{
            definition: {
                args: [{
                    name: '...number',
                    type: 'number'
                }],
                join: ' + ',
                name: 'sum',
                returns: 'number',
                type: 'function'
            },
            text: 'Sum'
        }],
        text: 'Math'
    }],
    singleton: true
});