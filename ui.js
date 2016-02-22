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

const LABEL_EMPTY = "    ";

const LABEL_PROJECT = "project: ";
const LABEL_PRIORITY = "priority: ";
//const LABEL_URGENCY = "urgency: ";
const LABEL_ENTERED = "entered: ";
//const LABEL_MODIFIED = "modified: ";
const LABEL_DUE = "due: ";
const LABEL_TAGS = "tags: ";

const LABEL_DELETE = "delete";
const LABEL_MODIFY = "modify";
const LABEL_DONE = "done";
const LABEL_START = "start";
const LABEL_STOP = "stop";

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
        // TODO handle launch cmd + character escape
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

        // Remove some original widget parts for reordering with extra buttons
        this._triangleBin.remove_child(this._triangle);
        this.actor.remove_child(this._triangleBin);

        this._button_done = new Button(LABEL_DONE);
        this.actor.add_child(this._button_done.actor);

        this._button_start = new Button(LABEL_START);
        this.actor.add_child(this._button_start.actor);

        this._button_stop = new Button(LABEL_STOP);
        this.actor.add_child(this._button_stop.actor);

        this._triangleBin.add_child(this._triangle);
        this.actor.add_child(this._triangleBin);

    }
});

/*
 * Class for widget handling advanced display information and advanced buttons like delete, etc ...
 */
const TaskwarriorMenuAdvancedItem1 = new Lang.Class({
    Name: 'Taskwarrior.MenuAdvancedItem1',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(task) {
        this.parent();

        this.label_project = new St.Label({ text: LABEL_PROJECT + LABEL_EMPTY });
        this.label_priority = new St.Label({ text: LABEL_PRIORITY + LABEL_EMPTY });
        this.label_entered = new St.Label({ text: LABEL_ENTERED +LABEL_EMPTY });

        if (task.project != null) {
            this.label_project = new St.Label({ text: LABEL_PROJECT + task.project });
        }
        if (task.priority != null) {
            this.label_priority = new St.Label({ text: LABEL_PRIORITY + task.priority });
        }

        if (task.entry != null) {
            this.label_entered = new St.Label({ text: LABEL_ENTERED + task.entry });
        }


        this.actor.add_child(this.label_project);
        this.actor.add_child(this.label_priority);
        this.actor.add_child(this.label_entered);
        //this.actor.label_actor = this.label_project ;

        let expander = new St.Bin({ style_class: 'popup-menu-item-expander' });
        this.actor.add(expander, { expand: true });

        this._button_modify = new Button(LABEL_MODIFY);
        this.actor.add_child(this._button_modify.actor);

    },

    setStatus: function(text) {
    }

});

/*
 * Class for widget handling advanced display information and advanced buttons like delete, etc ...
 */
const TaskwarriorMenuAdvancedItem2 = new Lang.Class({
    Name: 'Taskwarrior.MenuAdvancedItem2',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(task) {
        this.parent();

        this.label_due = new St.Label({ text: LABEL_DUE + LABEL_EMPTY });
        this.label_tags = new St.Label({ text: LABEL_TAGS + LABEL_EMPTY });

        if (task.due != null) {
            this.label_due = new St.Label({ text: LABEL_DUE + task.due });
        }
        if (task.tags != null) {
            this.label_tags = new St.Label({ text: LABEL_TAGS + task.tags });
        }

        this.actor.add_child(this.label_due);
        this.actor.add_child(this.label_tags);

        let expander = new St.Bin({ style_class: 'popup-menu-item-expander' });
        this.actor.add(expander, { expand: true });

        this._button_del = new Button(LABEL_DELETE);
        this.actor.add_child(this._button_del.actor);

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
        // TODO dispatch table ?
        log(this.actor.get_label());
    },

    toggle: function() {

    }
});