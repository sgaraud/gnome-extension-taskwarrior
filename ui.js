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

const Lang = imports.lang;
const Main = imports.ui.main;
const St = imports.gi.St;
const ShellEntry = imports.ui.shellEntry;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const MessageTray = imports.ui.messageTray;
const ModalDialog = imports.ui.modalDialog;
const BoxPointer = imports.ui.boxpointer;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Taskwarrior = Me.imports.taskwarrior;

const NOTIF_ICON = 'taskwarrior-logo';
var taskMenuList = null;
/*
 * Class for widget task list menu
 * TODO check if optimization required
 * TODO make a filter system on tasklist
 */
const TaskwarriorListMenu = new Lang.Class({
    Name: 'Taskwarrior.ListMenu',

    _init: function(menu) {
        taskMenuList = menu;
    },

    refresh: function() {
        let i;

        // Rebuild completely the menu with updated data
        taskMenuList.removeAll();

        // Display entry field for Adding Tasks
        taskMenuList.addMenuItem(new TaskwarriorShellEntry());

        let taskList = Taskwarrior.taskwarriorCmds[Taskwarrior.TASK_EXPORT](Taskwarrior.TASK_STATUS_PENDING);
        // If nothing to display, just finish here
        if (typeof taskList === 'undefined' || taskList == Taskwarrior.TASK_ERROR) {
            return;
        }

        // Lists the current tasks as sorted in the taskList struct
        for (i = 0; i < taskList.length; i++) {

            // Sub menu with buttons delete, modify
            // Show extra tasks infos project, urgency, date
            let itemSub1 = new TaskwarriorMenuAdvancedItem1(taskList[i]);
            let itemSub2 = new TaskwarriorMenuAdvancedItem2(taskList[i]);
            let itemSub3 = new TaskwarriorMenuAdvancedItem3(taskList[i]);
            let itemSub4 = new TaskwarriorMenuAdvancedItem4(taskList[i]);

            // Show task description + button done + button start  + arrow to expand with extra options
            let item = new TaskwarriorMenuItem(taskList[i]);

            item.menu.addMenuItem(itemSub1);
            item.menu.addMenuItem(itemSub2);
            item.menu.addMenuItem(itemSub3);
            item.menu.addMenuItem(itemSub4);
            taskMenuList.addMenuItem(item);
        }
    }
});


/*
 * Class for widget handling add new task field
 */
const TaskwarriorShellEntry = new Lang.Class({
    Name: 'Taskwarrior.ShellEntry',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(params) {
        this.parent(params);

        this._entry = new St.Entry({ can_focus: true, style_class: 'task-entry', x_expand: true , hint_text: _("Add task ...") });
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
        let status = Taskwarrior.taskwarriorCmds[Taskwarrior.TASK_ADD](text);
        TaskwarriorListMenu.prototype.refresh();
        _userNotification(status, Taskwarrior.TASK_ADD, text);
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

    _init: function(task) {
        this.parent(task.description);


        //this.actor.add_style_class_name('task-label-data-red');

        // Remove some original widget parts for rebuilding with the extra buttons
        this._triangleBin.remove_child(this._triangle);
        this.actor.remove_child(this._triangleBin);

        this._button_done = new TaskButton(Taskwarrior.TASK_DONE, task, 'task-button-done');
        this.actor.add_child(this._button_done.actor);

        if (typeof task.start != 'undefined') {
            this._button_stop = new TaskButton(Taskwarrior.TASK_STOP, task, 'task-button-danger');
            this.actor.add_child(this._button_stop.actor);
        }
        else {
            this._button_start = new TaskButton(Taskwarrior.TASK_START, task, 'task-button');
            this.actor.add_child(this._button_start.actor);
        }

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

        this.label_priority = new St.Label({ text: Taskwarrior.LABEL_PRIORITY, style_class: 'task-label' });
        this.actor.add_child(this.label_priority);
        if (typeof task.priority != 'undefined') {
            let style = 'task-label-data';
            if ( task.priority == 'H') {
                style = 'task-label-data-red';
            }
            else if ( task.priority == 'M') {
                style = 'task-label-data-orange';
            }
            this.label_priority_value = new St.Label({ text: task.priority, style_class: style });
        }
        else {
            this.label_priority_value = new St.Label({ text: Taskwarrior.LABEL_EMPTY, style_class: 'task-label-data' });
        }
        this.actor.add_child(this.label_priority_value);

        this.label_project = new St.Label({ text: Taskwarrior.LABEL_PROJECT, style_class: 'task-label-center' });
        this.actor.add_child(this.label_project);
        if (typeof task.project != 'undefined') {
            this.label_project_value = new St.Label({ text: task.project, style_class: 'task-label-data' });
        }
        else {
            this.label_project_value = new St.Label({ text: Taskwarrior.LABEL_EMPTY, style_class: 'task-label-data'  });
        }
        this.actor.add_child(this.label_project_value);

        this.label_tags = new St.Label({ text: Taskwarrior.LABEL_TAGS, style_class: 'task-label-center' });
        this.actor.add_child(this.label_tags);
        if (typeof task.tags != 'undefined') {
            this.label_tags_value = new St.Label({ text: task.tags.toString(), style_class: 'task-label-data'  });
        }
        else {
            this.label_tags_value = new St.Label({ text: Taskwarrior.LABEL_EMPTY, style_class: 'task-label-data'  });
        }
        this.actor.add_child(this.label_tags_value);
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

        this.label_entered = new St.Label({ text: Taskwarrior.LABEL_ENTERED, style_class: 'task-label' });
        this.actor.add_child(this.label_entered);
        if (typeof task.entry != 'undefined') {
            this.label_entered_value = new St.Label({ text: Taskwarrior._checkDate(task.entry),
                style_class: 'task-label-data'  });
            this.actor.add_child(this.label_entered_value);
        }

        let expander = new St.Bin({ style_class: 'popup-menu-item-expander' });
        this.actor.add(expander, { expand: true });

        this._button_del = new TaskButton(Taskwarrior.TASK_DELETE, task, 'task-button-danger');
        this.actor.add_child(this._button_del.actor);
    }
});

/*
 * Class for widget handling advanced display information and advanced buttons like delete, etc ...
 */
const TaskwarriorMenuAdvancedItem3 = new Lang.Class({
    Name: 'Taskwarrior.MenuAdvancedItem3',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(task) {
        this.parent();

        this.label_start = new St.Label({ text: Taskwarrior.LABEL_START, style_class: 'task-label' });
        this.actor.add_child(this.label_start);
        if (typeof task.start != 'undefined') {
            this.label_start_value = new St.Label({ text: Taskwarrior._checkDate(task.start),
                style_class: 'task-label-data'  });
        }
        else {
            this.label_start_value = new St.Label({ text: Taskwarrior.LABEL_EMPTY, style_class: 'task-label-data' });
        }
        this.actor.add_child(this.label_start_value);

        let expander = new St.Bin({ style_class: 'popup-menu-item-expander' });
        this.actor.add(expander, { expand: true });

        this._button_mod = new TaskButton(Taskwarrior.TASK_MODIFY, task, 'task-button');
        this.actor.add_child(this._button_mod.actor);

    }
});


/*
 * Class for widget handling advanced display information and advanced buttons like delete, etc ...
 */
const TaskwarriorMenuAdvancedItem4 = new Lang.Class({
    Name: 'Taskwarrior.MenuAdvancedItem4',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(task) {
        this.parent();

        this.label_due = new St.Label({ text: Taskwarrior.LABEL_DUE, style_class: 'task-label' });
        this.actor.add_child(this.label_due);
        if (typeof task.due != 'undefined') {
            this.label_due_value = new St.Label({ text: Taskwarrior._checkDate(task.due),
                style_class: 'task-label-data'  });

        }
        else {
            this.label_due_value = new St.Label({ text: Taskwarrior.LABEL_EMPTY, style_class: 'task-label-data' });
        }
        this.actor.add_child(this.label_due_value);
    }
});


/*
 * Button class to call various actions
 */
const TaskButton = new Lang.Class({
    Name: 'Task.Button',
    extends: 'Button',

    _init: function(text, task, style) {
        this.taskid = task.uuid;
        this.taskdesc = task.description;
        this.actor = new St.Button({ reactive: true, can_focus: true, track_hover: true, style_class: style, label: text });
        this.actor.get_child().single_line_mode = true;

        this.action = Taskwarrior.taskwarriorCmds.hasOwnProperty(this.actor.get_label()) ? this.actor.get_label() : "default";


        if (this.action === Taskwarrior.TASK_DELETE){
            this.actor.connect('clicked', Lang.bind(this, this._onConfirmed));
        }
        else if (this.action === Taskwarrior.TASK_MODIFY){
            this.actor.connect('clicked', Lang.bind(this, this._onModified));
        }
        else {
            this.actor.connect('clicked', Lang.bind(this, this._onClicked));
        }
    },

    _onClicked: function() {
        let status = Taskwarrior.taskwarriorCmds[this.action](this.taskid);
        log( this.actor.get_label(), status, this.action, this.taskdesc);
        TaskwarriorListMenu.prototype.refresh();
        _userNotification(status, this.action, this.taskdesc);
   },

    _onConfirmed: function() {
        let confirmDialog = new TaskConfirmDialog(
            _('Are you sure you want to delete the task?'),
            _(''),
            Lang.bind(this, function() {
                let status = Taskwarrior.taskwarriorCmds[this.action](this.taskid);
                log( this.actor.get_label(), status, this.action, this.taskdesc);
                TaskwarriorListMenu.prototype.refresh();
                _userNotification(status, this.action, this.taskdesc);
            })
        );
        taskMenuList.close();
        confirmDialog.open();
    },

    _onModified: function() {
        let modifyDialog = new TaskModifyDialog(
            _('Modify the task attributes'),
            _(''),
            Lang.bind(this, function(text) {
                let status = Taskwarrior.taskwarriorCmds[this.action](this.taskid, text);
                log( this.actor.get_label(), status, this.action, this.taskdesc, text);
                TaskwarriorListMenu.prototype.refresh();
                _userNotification(status, this.action, this.taskdesc);
            })
        );
        taskMenuList.close();
        modifyDialog.open();
    }
});

/*
 * Prompt dialog to confirm command before execution
 */
const TaskConfirmDialog = new Lang.Class({
    Name: 'Task.Confirm.Dialog',
    Extends: ModalDialog.ModalDialog,

    _init: function(title, message, callback) {
        this.parent();
        this._callback = callback;

        this.contentLayout.add(new St.Label({text: title}));
        this.contentLayout.add(new St.Label({text: message}));

        this.setButtons([
            { label: _('Cancel'), action: Lang.bind(this, this._onCancelButton), key: Clutter.Escape},
            { label: _('Ok'), action: Lang.bind(this, this._onOkButton), key: Clutter.Return }
        ]);
    },

    _onCancelButton: function() {
        this.close();
        taskMenuList.open();
    },

    _onOkButton: function() {
        this._callback();
        this.close();
        taskMenuList.open();
    }
});


/*
 * Prompt dialog to modify task attributes
 */
const TaskModifyDialog = new Lang.Class({
    Name: 'Task.Modify.Dialog',
    Extends: ModalDialog.ModalDialog,

    _init: function(title, message, callback) {
        this.parent();
        this._callback = callback;

        this.contentLayout.add(new St.Label({text: title}));
        this.contentLayout.add(new St.Label({text: message}));
        this.modEntry = new St.Entry({style_class: 'task-entry'});
        this.contentLayout.add(this.modEntry);
        this.contentLayout.add(new St.Label({text: ''}));

        this.setButtons([
            { label: _('Cancel'), action: Lang.bind(this, this._onCancelButton), key: Clutter.Escape},
            { label: _('Ok'), action: Lang.bind(this, this._onOkButton), key: Clutter.Return }
        ]);
    },

    _onCancelButton: function() {
        this.close();
        taskMenuList.open();
    },

    _onOkButton: function() {
        log(this.modEntry.get_text());
        this._callback(this.modEntry.get_text());
        this.close();
        taskMenuList.open();
    }
});

/*
 * Notify user of action performed
 * TODO only on failure ?
 */
function _userNotification(status, action, desc) {
    let source = new MessageTray.Source("taskwarrior", NOTIF_ICON);
    let notif_title = !status ? "command " + action + " ok" : "command " + action + " failed";
    let notif_msg = "task - " + desc;
    let notification = new MessageTray.Notification(source, notif_title, notif_msg);
    Main.messageTray.add(source);
    source.notify(notification);
}