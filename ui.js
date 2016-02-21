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
const Main = imports.ui.main;
const St = imports.gi.St;
const Params = imports.misc.params;
const Shell      = imports.gi.Shell;
const ShellEntry = imports.ui.shellEntry;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;
const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

/*
 * Class for widget handling add new task field
 */
const TaskwarriorShellEntry = new Lang.Class({
    Name: 'Taskwarrior.ShellEntry',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(params) {
        this.parent(params);

        this._entry = new St.Entry({ can_focus: true , x_expand: true , hint_text: _("Add task ...") });
        ShellEntry.addContextMenu(this._entry);
        this.actor.add_child(this._entry);

        this._entry.clutter_text.connect('activate', Lang.bind(this, function (o, e) {

            let text = o.get_text();
            // Ensure no newlines in the data
            text = text.replace('\n', ' ');
            // Or leading and trailing whitespaces
            text = text.replace(/^\s+/g, '').replace(/\s+$/g, '');
            if (text == '') {
                return true;
            }
            this.cmd(text);
            return true;
        }));

    },

    cmd: function(text) {
        // TODO handle
        log(text);
        // Reset type command
        this._entry.text = '';
    },

    activate: function(event) {
        // Allow mouse click to enter entry box without closing the menu
        // TODO Allow pressing TAB to enter entry box event.get_key_symbol() == Clutter.KEY_Tab
        if (event.type() == Clutter.EventType.BUTTON_RELEASE ) {
            return;
        }
        this.parent(event);
    }

});

/*
 * Class for widget handling core display information (task description and done button)
 */
const TaskwarriorMenuItem = new Lang.Class({
    Name: 'Taskwarrior.MenuItem',
    Extends: PopupMenu.PopupSubMenuMenuItem,

    _init: function(params) {
        this.parent(params);

        // Remove widget for reordering with extra button
        this._triangleBin.remove_child(this._triangle);
        this.actor.remove_child(this._triangleBin);

        this._button_done = new Button(_('done'));
        this.actor.add_child(this._button_done.actor);

        this._triangleBin.add_child(this._triangle);
        this.actor.add_child(this._triangleBin);

    }
});

/*
 * Class for widget handling advanced display information and advanced buttons like modify, start, etc ...
 */
const TaskwarriorMenuAdvancedItem = new Lang.Class({
    Name: 'Taskwarrior.MenuAdvancedItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(task) {
        this.parent();

        this._button_del = new Button(_('delete'));
        this._button_modify = new Button(_('modify'));
        this._button_start = new Button(_('start'));
        this._button_stop = new Button(_('stop'));

        this.actor.add_child(this._button_del.actor);
        this.actor.add_child(this._button_modify.actor);
        this.actor.add_child(this._button_start.actor);
        this.actor.add_child(this._button_stop.actor);

        this.label_uuid = new St.Label({ text: task.urgency.toString() });
        this.actor.add_child(this.label_uuid );
        this.actor.label_actor = this.label_uuid ;
    },

    setStatus: function(text) {
    }

});

const Button = new Lang.Class({
    Name: 'Button',

    _init: function(text) {
        this.actor = new St.Button({ reactive: true,
            track_hover: true,
            label: text });

        this.actor.get_child().single_line_mode = true;
        this.actor.connect('clicked', Lang.bind(this, this._onClicked));
    },

    _onClicked: function() {
        log(this.actor.get_label());
    },

    toggle: function() {

    }
});