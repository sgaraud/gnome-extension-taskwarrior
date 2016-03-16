# Taskwarrior access from GNOME Shell

This GNOME shell extension is enabling access to [Taskwarrior](https://taskwarrior.org/) from the gnome shell taskbar.

### Supported Taskwarrior Features

 * Display pending tasks list (default by urgency) 
 * Display extended tasks data (due date, project, priority and tags)
 * Add new tasks
 * Mark tasks as done
 * Delete tasks
 * Start/Stop tasks
 * Modify task attributes
 * Filter pending task list on projects, tags, etc ...

### Upcoming Features

 * Customization through preferences menu
 * More keybindings
 * Constant menu width

### Screenshots

> taskwarrior gnome shell extension.

![taskwarrior gnome shell extension 01](taskwarriorgnomeshell1.png?raw=true
 "taskwarrior gnome shell extension")

![taskwarrior gnome shell extension 02](taskwarriorgnomeshell2.png?raw=true
 "taskwarrior gnome shell extension")

![taskwarrior gnome shell extension 03](taskwarriorgnomeshell3.png?raw=true
 "taskwarrior gnome shell extension")

### Usage

The usage is similar to taskwarrior command line syntax without the need to the "task id cmd" prefix.
To add a task just enter the description and extra attributes if needed inside the "Add task" field.
For instance:
    
    Edit extension usage in github README prio:H due:today +gnome

It will add a task with description "Edit extension usage in github README", priority H, tag "gnome" and due date set to today.

The pending task list can be filtered using the "Add filter" field. The filter field is persistent.
For instance for filtering all the task belonging to a specific project "gnome-extension":

    proj:gnome-extension

When the task is done, simply click on "done" button. The task can be started and stopped if fitting your workflow.

By clicking on the description, a submenu will be displayed allowing to "delete" or "modify" that specific task.
For instance to modify the due date to next monday, click on "modify" button and enter in the modal window:

    due:monday

The extension was developped primarily to support my own TODO workflow trying to keep the unobtrusive quality of taskwarrior.
Any improvement idea is welcome.

### Installation

#### From gnome extensions website

The extension is available from the extensions.gnome.org website. Visit the following link for
instructions.

https://extensions.gnome.org/extension/1052/taskwarrior-integration/

#### From source

The extension can be installed directly from source,
either for the convenience of using git or to test the latest version.

Clone the desire branch with git

    git clone https://github.com/sgaraud/gnome-extension-taskwarrior.git \
    ~/.local/share/gnome-shell/extensions/taskwarrior-integration@sgaraud.github.com

A Shell reload is required <code>Alt+F2 r Enter</code> and extension
has to be enabled with *gnome-tweak-tool*
### Configuration 

Configuration option currently available with *gnome-tweak-tool*.

> taskwarrior gnome shell extension preferences.

![taskwarrior gnome shell extension preferences](taskwarriorgnomeshellprefs01.png?raw=true
 "taskwarrior gnome shell extension preferences")

### Dependencies

Taskwarrior V2.3.0 or higher :exclamation: 
Make sure [Taskwarrior](https://taskwarrior.org/download/) is installed on your system.

### Bug Reporting

:sweat_smile: Bugs should be reported to the Github [bug tracker
issues](https://github.com/sgaraud/gnome-extension-taskwarrior/issues).

### Author

  * sgaraud (Sylvain Garaud)

### License

Copyright (C) 2016 Sylvain Garaud

> This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public 
> License as published by the Free Software Foundation, either version 2 of the License, or (at your option) any later
> version.
> This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
> warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
> You should have received a copy of the GNU General Public License along with this program.
> If not, see http://www.gnu.org/licenses/.

