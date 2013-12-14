///<reference path='controllers.ts'/>
///<reference path='utils.ts'/>

'use strict';

module ascii_draw {
    import Rectangle = utils.Rectangle;
    import CellPosition = utils.Point;
    import SelectMoveController = controllers.SelectMoveController;
    import RectangleController = controllers.RectangleController;

    var copypastearea: HTMLTextAreaElement;

    export var selection_button: HTMLButtonElement;
    export var rectangle_button: HTMLButtonElement;

    export var gridstatus: HTMLDivElement;
    export var mousestatus: HTMLDivElement;
    export var selectionstatus: HTMLDivElement;

    export var emptyCell: string = ' ';

    var mouse_pos: CellPosition = null;

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

            if (displacement !== null) {
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

    function onMouseDown(event: MouseEvent): void {
        var target = grid.getTargetCell(event.target);
        if (target !== null) {
            controllers.current.onMouseDown(target);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseUp(event: MouseEvent): void {
        var target = grid.getTargetCell(event.target);
        controllers.current.onMouseUp(target);
        event.stopPropagation();
        event.preventDefault();
    }

    function onMouseOver(event: MouseEvent): void {
        var target = grid.getTargetCell(event.target);
        if (target !== null) {
            var pos = grid.getCellPosition(target);
            setMousePosition(pos);
            controllers.current.onMouseOver(pos);
        }
        event.stopPropagation();
        event.preventDefault();
    }

    function setMousePosition(new_pos: CellPosition): void {
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

    function onMouseLeave(event: MouseEvent): void {
        setMousePosition(null);
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
        gridstatus = <HTMLDivElement>document.getElementById('gridstatus');
        selectionstatus = <HTMLDivElement>document.getElementById('selectionstatus');
        mousestatus = <HTMLDivElement>document.getElementById('mousestatus');

        grid.init();
        controllers.init();
        commands.init();

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
    }
}

window.addEventListener('load', ascii_draw.init, false);
