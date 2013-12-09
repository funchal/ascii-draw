///<reference path='controllers.ts'/>
///<reference path='utils.ts'/>

'use strict';

module ascii_draw {
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import SelectMoveController = controllers.SelectMoveController;
    import RectangleController = controllers.RectangleController;
    import commands = utils.commands;
    import Command = commands.Command;

    var copypastearea: HTMLTextAreaElement;

    export var selection_button: HTMLButtonElement;
    export var rectangle_button: HTMLButtonElement;
    var redo_button: HTMLButtonElement;
    var undo_button: HTMLButtonElement;

    export var gridstatus: HTMLDivElement;
    export var mousestatus: HTMLDivElement;
    export var selectionstatus: HTMLDivElement;

    export var emptyCell: string = ' ';

    function initiateCopyAction(): void {
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

    function completeCopyAction(): void {
        copypastearea.value = '';
        console.log('copy');
    }

    function initiatePasteAction(): void {
        copypastearea.value = '';
        copypastearea.focus();
    }

    function completePasteAction(): void {
        console.log('paste: ' + copypastearea.value);
        copypastearea.value = '';
    }

    function onUndo(): void {
        commands.undo();
        updateUndoRedo();
    }

    function onRedo(): void {
        commands.redo();
        updateUndoRedo();
    }

    function updateUndoRedo(): void {
        if (commands.canUndo()) {
            undo_button.disabled = false;
        } else {
            undo_button.disabled = true;
        }

        if (commands.canRedo()) {
            redo_button.disabled = false;
        } else {
            redo_button.disabled = true;
        }
    }

    function onKeyUp(event: KeyboardEvent): void {
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

    function onKeyPress(event: KeyboardEvent): void {
        if (!event.ctrlKey && !event.altKey &&
            !event.metaKey && event.charCode > 0) {
            controllers.current.onKeyPress(String.fromCharCode(event.charCode));
            event.preventDefault();
        }
        event.stopPropagation();
    }

    function onKeyDown(event: KeyboardEvent): void {
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

            if (displacement &&
                controllers.begin_highlight.isEqual(controllers.end_highlight)) {
                controllers.current.onArrowDown(displacement);
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
                    onRedo();
                    break;
                case 90: /* ctrl+z: undo */
                    onUndo();
                    break;
            }
        }
        event.stopPropagation();
    }

    export function applyToRectangle(rect: Rectangle,
                                     functor: Function,
                                     param: any): void
    {
        for (var r = rect.top_left.row; r <= rect.bottom_right.row; r++) {
            var row = grid.getRow(r);
            for (var c = rect.top_left.col; c <= rect.bottom_right.col; c++) {
                var cell = grid.getCell(c, row);
                functor(cell, param);
            }
        }
    }

    function onMouseDown(event: MouseEvent): void {
        var target = grid.getTargetCell(event.target);
        if (target !== null) {
            controllers.current.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event: MouseEvent): void {
        controllers.current.onMouseUp();
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event: MouseEvent): void {
        var target = grid.getTargetCell(event.target);
        if (target !== null) {
            controllers.current.onMouseOver(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseLeave(event: MouseEvent): void {
        controllers.current.onMouseLeave();
        event.stopPropagation();
        event.preventDefault();
    }

    function onContextMenu(event: MouseEvent): void {
        event.stopPropagation();
        event.preventDefault();
    }

    export function init(): void {
        copypastearea = <HTMLTextAreaElement>document.getElementById('copypastearea');
        rectangle_button = <HTMLButtonElement>document.getElementById('rectangle-button');
        selection_button = <HTMLButtonElement>document.getElementById('selection-button');
        undo_button = <HTMLButtonElement>document.getElementById('undo-button');
        redo_button = <HTMLButtonElement>document.getElementById('redo-button');
        gridstatus = <HTMLDivElement>document.getElementById('gridstatus');
        selectionstatus = <HTMLDivElement>document.getElementById('selectionstatus');
        mousestatus = <HTMLDivElement>document.getElementById('mousestatus');

        grid.init();
        controllers.init();

        updateUndoRedo();

        grid.container.addEventListener('mousedown', onMouseDown, false);
        window.addEventListener('mouseup', onMouseUp, false);
        grid.container.addEventListener('mouseover', onMouseOver, false);
        grid.container.addEventListener('mouseleave', onMouseLeave, false);
        window.addEventListener('contextmenu', onContextMenu, false);
        window.addEventListener('keydown', onKeyDown, false);
        window.addEventListener('keyup', onKeyUp, false);
        window.addEventListener('keypress', onKeyPress, false);

        rectangle_button.addEventListener(
            'click', controllers.swap(RectangleController), false);

        selection_button.addEventListener(
            'click', controllers.swap(SelectMoveController), false);

        undo_button.addEventListener('click', onUndo, false);
        redo_button.addEventListener('click', onRedo, false);
    }
}

window.addEventListener('load', ascii_draw.init, false);
