///<reference path='utils.ts'/>
///<reference path='modes.ts'/>
///<reference path='commands.ts'/>
///<reference path='select_cmd.ts'/>
///<reference path='rectangle_cmd.ts'/>
///<reference path='fill_cmd.ts'/>
///<reference path='text_cmd.ts'/>
///<reference path='move_cmd.ts'/>

'use strict';

module ascii_draw
{
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import Cell = grid.Cell;
    import Command = commands.Command;

    var copypastearea: HTMLTextAreaElement;

    export var gridstatus: HTMLDivElement;
    export var mousestatus: HTMLDivElement;
    export var selectionstatus: HTMLDivElement;

    var mouse_pos: CellPosition = null;

    function initiateCopyAction(): void
    {
        if (window.getSelection && document.createRange) {
            copypastearea.textContent = selection.getContents();
            var sel = window.getSelection();
            var range = document.createRange();
            range.selectNodeContents(copypastearea);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.log('fail to copy');
        }
    }

    function completeCopyAction(): void
    {
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction(): void
    {
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction(): void
    {
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
    }

    function onKeyUp(event: KeyboardEvent): void
    {
        if (event.ctrlKey && !event.altKey && !event.shiftKey) {
            switch (event.keyCode) {
                case 67: /* ctrl+c: copy */
                    completeCopyAction();
                    break;
                case 86: /* ctrl+v: paste */
                    completePasteAction();
                    break;
                case 88: /* ctrl+x: cut */
                    completeCopyAction();
                    break;
            }
        }
        event.stopPropagation();
    }

    function onKeyPress(event: KeyboardEvent): void
    {
        if (!event.ctrlKey && !event.altKey &&
            !event.metaKey && event.charCode > 0) {
            if (commands.pending === null) {
                if (selection.isUnit()) {
                    var cmd = new TextCommand();
                    cmd.character = String.fromCharCode(event.charCode);
                    cmd.complete();
                    commands.complete(cmd);
                } else {
                    var cmd = new FillCommand();
                    cmd.character = String.fromCharCode(event.charCode);
                    cmd.complete();
                    commands.complete(cmd);
                }
            }
            event.preventDefault();
        }
        event.stopPropagation();
    }

    function onKeyDown(event: KeyboardEvent): void
    {
        if (!event.ctrlKey && !event.altKey &&
            !event.shiftKey && !event.metaKey) {
            var displacement: Array<number> = null;
            switch (event.keyCode) {
                case 37: /* left arrow */
                    displacement = [0, -1];
                    event.preventDefault();
                    break;
                case 38: /* up arrow */
                    displacement = [-1, 0];
                    event.preventDefault();
                    break;
                case 39: /* right arrow */
                    displacement = [0, 1];
                    event.preventDefault();
                    break;
                case 40: /* down arrow */
                    displacement = [1, 0];
                    event.preventDefault();
                    break;
                case 9: /* tab */
                    event.preventDefault();
                    break;
                case 13: /* enter */
                    event.preventDefault();
                    break;
                case 8: /* backspace */
                    // TODO: print a space character
                    event.preventDefault();
                    break;
                case 27: /* escape */
                    event.preventDefault();
                    break;
                case 46: /* delete */
                    event.preventDefault();
                    break;
            }

            if (commands.pending === null && 
                    displacement !== null && 
                    selection.isUnit()) {
                var cmd = new MoveCommand();
                cmd.move_contents = false;
                var rect: Rectangle = <Rectangle>selection.contents[0];
                cmd.initiate(new CellPosition(rect.top, rect.left));
                cmd.change(new CellPosition(displacement[0], displacement[1]));
                cmd.complete();
                commands.complete(cmd);
            }
        }

        if (event.ctrlKey && !event.altKey &&
            !event.shiftKey && !event.metaKey) {
            switch (event.keyCode) {
                case 67: /* ctrl+c: copy */
                    initiateCopyAction();
                    break;
                case 86: /* ctrl+v: paste */
                    initiatePasteAction();
                    break;
                case 88: /* ctrl+x: cut */
                    initiateCopyAction();
                    break;
                case 89: /* ctrl+y: redo */
                    commands.onRedo();
                    break;
                case 90: /* ctrl+z: undo */
                    commands.onUndo();
                    break;
            }
        }
        event.stopPropagation();
    }

    export function applyToRectangle(rect: Rectangle,
                                     functor: Function,
                                     param: any): void
    {
        for (var r = rect.top; r <= rect.bottom; r++) {
            var row = grid.getRow(r);
            for (var c = rect.left; c <= rect.right; c++) {
                var cell = grid.getCell(row, c);
                functor(cell, param);
            }
        }
    }

    export function setHighlighted(cell: Cell, highlighted: boolean): void
    {
        if (cell['data-highlighted'] !== highlighted) {
            cell['data-highlighted'] = highlighted;
            if (highlighted) {
                utils.addClass(cell, 'highlighted');
            } else {
                utils.removeClass(cell, 'highlighted');
            }
        } else {
            //console.log('highlighted already set to ' + highlighted);
        }
    }

    export var begin_highlight: CellPosition = new CellPosition(0, 0);
    export var end_highlight: CellPosition = begin_highlight;

    function onMouseDown(event: MouseEvent): void
    {
        var target = grid.getTargetCell(event.target);
        if (target !== null) {
            var pos = grid.getCellPosition(target);
            if (target['data-selected'] === true) {
                commands.pending = new MoveCommand();
            } else {
                if (modes.current == modes.SelectMoveMode) {
                    commands.pending = new SelectCommand();
                } else if (modes.current == modes.RectangleMode) {
                    commands.pending = new RectangleCommand();
                }
            }
            commands.pending.initiate(pos);
        }

        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event: MouseEvent): void
    {
        var target = grid.getTargetCell(event.target);
        if (target !== null) {
            var pos = grid.getCellPosition(target);
            setMousePosition(pos);
            if (commands.pending !== null) {
                window.setTimeout(commands.pending.change.bind(commands.pending, pos), 0);
            }
        }

        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event: MouseEvent): void
    {
        if (commands.pending !== null) {
            var target = grid.getTargetCell(event.target);
            if (target !== null) {
                var pos = grid.getCellPosition(target);
                commands.pending.change(pos);
            }
            commands.pending.complete();
            commands.complete(commands.pending);
            commands.pending = null;
        }

        event.stopPropagation();
        event.preventDefault();
    }

    function setMousePosition(new_pos: CellPosition): void
    {
        if (mouse_pos !== null) {
            var cell = grid.getCell(grid.getRow(mouse_pos.row), mouse_pos.col);
            utils.removeClass(cell, 'mouse');
        }
        mouse_pos = new_pos;

        var mousestatus = document.getElementById('mousestatus');
        if (mouse_pos !== null) {
            var cell = grid.getCell(grid.getRow(mouse_pos.row), mouse_pos.col);
            utils.addClass(cell, 'mouse');
            mousestatus.textContent = 'Cursor: ' + mouse_pos;
        } else {
            mousestatus.textContent = '';
        }
    }

    function onMouseLeave(event: MouseEvent): void
    {
        setMousePosition(null);
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event: MouseEvent): void
    {
        event.stopPropagation();
        event.preventDefault();
    }

    export function init(): void
    {
        copypastearea = <HTMLTextAreaElement>document.getElementById('copypastearea');
        gridstatus = <HTMLDivElement>document.getElementById('gridstatus');
        selectionstatus = <HTMLDivElement>document.getElementById('selectionstatus');
        mousestatus = <HTMLDivElement>document.getElementById('mousestatus');

        grid.init();
        modes.init();
        commands.init();

        grid.container.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        grid.container.addEventListener('mouseover', onMouseOver, false);
        grid.container.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);
    }
}

window.addEventListener('load', ascii_draw.init, false);
