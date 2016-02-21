/*
 * Taskwarrior Integration with Gnome Shell
 * https://github.com/sgaraud/gnome-extension-taskwarrior
 *
 * Copyright (C) 2016 Sylvain Garaud
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this
 * program. If not, see http://www.gnu.org/licenses/.
 *
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Params = imports.misc.params;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('taskwarrior-integration');
const _ = Gettext.gettext;

const TOGGLE_MENU = 'toggle-menu';
let Schema = null;

function init() {
    Schema = Convenience.getSettings();
}

const KeybindingsWidget = new GObject.Class({
    Name: 'Keybindings.Widget',
    GTypeName: 'KeybindingsWidget',
    Extends: Gtk.Box,

    _init: function(keybindings) {
        this.parent();
        this.set_orientation(Gtk.Orientation.VERTICAL);

        this._keybindings = keybindings;

        let scrolled_window = new Gtk.ScrolledWindow();
        scrolled_window.set_policy(
            Gtk.PolicyType.AUTOMATIC,
            Gtk.PolicyType.AUTOMATIC
        );

        this._columns = {
            NAME: 0,
            ACCEL_NAME: 1,
            MODS: 2,
            KEY: 3
        };

        this._store = new Gtk.ListStore();
        this._store.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_INT,
            GObject.TYPE_INT
        ]);

        this._tree_view = new Gtk.TreeView({
            model: this._store,
            hexpand: true,
            vexpand: true
        });
        this._tree_view.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

        let action_renderer = new Gtk.CellRendererText();
        let action_column = new Gtk.TreeViewColumn({
            'title': _('Action'),
            'expand': true
        });
        action_column.pack_start(action_renderer, true);
        action_column.add_attribute(action_renderer, 'text', 1);
        this._tree_view.append_column(action_column);

        let keybinding_renderer = new Gtk.CellRendererAccel({
            'editable': true,
            'accel-mode': Gtk.CellRendererAccelMode.GTK
        });
        keybinding_renderer.connect('accel-edited',
            Lang.bind(this, function(renderer, iter, key, mods) {
                let value = Gtk.accelerator_name(key, mods);
                let [success, iterator ] =
                    this._store.get_iter_from_string(iter);

                if(!success) {
                    printerr(_("Can't change keybinding"));
                }

                let name = this._store.get_value(iterator, 0);

                this._store.set(
                    iterator,
                    [this._columns.MODS, this._columns.KEY],
                    [mods, key]
                );
                Schema.set_strv(name, [value]);
            })
        );

        let keybinding_column = new Gtk.TreeViewColumn({
            'title': _('Modify')
        });
        keybinding_column.pack_end(keybinding_renderer, false);
        keybinding_column.add_attribute(
            keybinding_renderer,
            'accel-mods',
            this._columns.MODS
        );
        keybinding_column.add_attribute(
            keybinding_renderer,
            'accel-key',
            this._columns.KEY
        );
        this._tree_view.append_column(keybinding_column);

        scrolled_window.add(this._tree_view);
        this.add(scrolled_window);

        this._refresh();
    },

    _refresh: function() {
        this._store.clear();

        for(let settings_key in this._keybindings) {
            let [key, mods] = Gtk.accelerator_parse(
                Schema.get_strv(settings_key)[0]
            );

            let iter = this._store.append();
            this._store.set(iter,
                [
                    this._columns.NAME,
                    this._columns.ACCEL_NAME,
                    this._columns.MODS,
                    this._columns.KEY
                ],
                [
                    settings_key,
                    this._keybindings[settings_key],
                    mods,
                    key
                ]
            );
        }
    }
});

const PrefsGrid = new GObject.Class({
    Name: 'Prefs.Grid',
    GTypeName: 'PrefsGrid',
    Extends: Gtk.Grid,

    _init: function(settings, params) {
        this.parent(params);
        this._settings = settings;
        this.margin = this.row_spacing = this.column_spacing = 10;
        this._rownum = 0;
    },

    add_item: function(widget, col, colspan, rowspan) {
        this.attach(
            widget,
            col || 0,
            this._rownum,
            colspan || 2,
            rowspan || 1
        );
        this._rownum++;

        return widget;
    }
});

const TaskwarriorIntegrationPrefsWidget = new GObject.Class({
    Name: 'TaskwarriorIntegration.Prefs.Widget',
    GTypeName: 'TaskwarriorIntegrationPrefsWidget',
    Extends: Gtk.Box,

    _init: function (params) {
        this.parent(params);
        this.set_orientation(Gtk.Orientation.VERTICAL);

        let keybindings = this._get_keybindings_page();

        let stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
            transition_duration: 500
        });
        let stack_switcher = new Gtk.StackSwitcher({
            margin_left: 5,
            margin_top: 5,
            margin_bottom: 5,
            margin_right: 5,
            stack: stack
        });

        stack.add_titled(keybindings.page, keybindings.name, keybindings.name);

        this.add(stack_switcher);
        this.add(stack);
    },

    _get_keybindings_page: function() {
        let name = _("Shortcuts");
        let page = new PrefsGrid(Schema);

        let keybindings = {};
        keybindings[TOGGLE_MENU] =
            _("Open taskwarrior list");

        let keybindings_widget = new KeybindingsWidget(keybindings);
        keybindings_widget.set_sensitive(true);
        page.add_item(keybindings_widget)

        let result = {
            name: name,
            page: page
        };
        return result;
    },
});

function buildPrefsWidget() {
    let widget = new TaskwarriorIntegrationPrefsWidget();
    widget.show_all();

    return widget;
}