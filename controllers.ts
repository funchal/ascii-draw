///<reference path='utils.ts'/>

module ascii_draw {
    export module controllers {

        import Rectangle = utils.Rectangle;
        import CellPosition = utils.Point;

        export interface Controller {
            init(): void;
            reset(): void;
            onMouseDown(target: HTMLTableCellElement): void;
            onMouseUp(): void;
            onMouseOver(target: HTMLTableCellElement): void;
            onMouseLeave(): void;
            onArrowDown(displacement: Array<number>): void;
            onKeyPress(character: string): void;
            exit(): void;
        }

        export module RectangleController {
            export function init(): void {
                console.log('init');
                reset();
            }
            export function reset(): void {
                var selection_button = document.getElementById('rectangle-button');
                utils.addClass(selection_button, 'pressed');
            }
            export function onMouseDown(target: HTMLTableCellElement): void {
                console.log('down');
            }
            export function onMouseUp(): void {
                console.log('up');
            }
            export function onMouseOver(target: HTMLTableCellElement): void {
                console.log('over');
            }
            export function onMouseLeave(): void {
                console.log('leave');
            }
            export function onArrowDown(displacement: Array<number>): void {
                console.log('arrowdown');
            }
            export function onKeyPress(character: string) {
                console.log('keypress');
            }
            export function exit(): void {
                console.log('exit');
                var selection_button = document.getElementById('rectangle-button');
                utils.removeClass(selection_button, 'pressed');
            }

            function drawRectangle():void {
                // TODO
            }
        }

        export module SelectMoveController {
            var selecting = false;
            var mouse_pos: CellPosition = null;

            export function init(): void {
                reset();
                begin_selection = new CellPosition(0, 0);
                end_selection = begin_selection;
                setSelected(getCellAt(begin_selection), true);
            }

            export function reset(): void {
                var selection_button = document.getElementById('selection-button');
                utils.addClass(selection_button, 'pressed');
            }

            export function onMouseDown(target: HTMLTableCellElement): void {
                // TODO: if current cell is selected change to move mode
                selecting = true;
                setSelection(getCellPosition(target), getCellPosition(target));
            }

            export function onMouseUp(): void {
                selecting = false;
            }

            export function onMouseOver(target: HTMLTableCellElement): void {
                var pos = getCellPosition(target);
                setMousePosition(pos);
                if (selecting) {
                    setSelection(begin_selection, pos);
                }
            }

            export function onMouseLeave(): void {
                setMousePosition(null);
            }

            export function onArrowDown(displacement: Array<number>): void {
                var pos = new CellPosition(begin_selection.row + displacement[0],
                           begin_selection.col + displacement[1]);
                setSelection(pos, pos);

            }
            export function onKeyPress(character: string) {
                applyToRectangle(new Rectangle(begin_selection, end_selection, true /*normalize*/),
                                 function(cell: HTMLTableCellElement) {
                                    cell.children[0].textContent = character;
                                 });
                var displacement = [0, 1];
                if (displacement && begin_selection.isEqual(end_selection) &&
                                    begin_selection.isEqual(end_selection)) {
                    var pos = new CellPosition(begin_selection.row + displacement[0],
                                               begin_selection.col + displacement[1]);
                    setSelection(pos, pos);
                }
            }

            export function exit(): void {
                console.log('exit');
                var selection_button = document.getElementById('selection-button');
                utils.removeClass(selection_button, 'pressed');
            }

            function setMousePosition(new_pos: CellPosition): void {
                if (mouse_pos !== null) {
                    utils.removeClass(getCellAt(mouse_pos), 'mouse');
                }
                mouse_pos = new_pos;

                var mousestatus = document.getElementById('mousestatus');
                if (mouse_pos !== null) {
                    utils.addClass(getCellAt(mouse_pos), 'mouse');
                    mousestatus.textContent = 'Cursor: ' + mouse_pos;
                } else {
                    mousestatus.textContent = '';
                }
            }

            function setSelection(new_begin_selection: CellPosition,
                                  new_end_selection: CellPosition): void {
                var new_selection = new Rectangle(new_begin_selection,
                                                  new_end_selection,
                                                  true /*normalize*/);
                var old_selection = new Rectangle(begin_selection,
                                                  end_selection,
                                                  true /*normalize*/);

                if (old_selection.isEqual(new_selection)) {
                    return;
                }

                begin_selection = new_begin_selection;
                end_selection = new_end_selection;

                var keep = old_selection.intersect(new_selection);
                var clear = old_selection.subtract(keep);
                var paint = new_selection.subtract(keep);

                for (var i = 0; i < clear.length; i++) {
                    applyToRectangle(clear[i], setSelected, false);
                }

                for (var i = 0; i < paint.length; i++) {
                    applyToRectangle(paint[i], setSelected, true);
                }

                var selectionstatus = document.getElementById('selectionstatus');
                if (new_selection.getHeight() > 1 || new_selection.getWidth() > 1) {
                    selectionstatus.textContent = 'Selection: ' +
                        new_selection.getHeight() + 'x' + new_selection.getWidth();
                } else {
                    selectionstatus.textContent = '';
                }
            }
        }
    }
}
