///<reference path='utils.ts'/>
///<reference path='grid.ts'/>
///<reference path='selection.ts'/>
///<reference path='commands.ts'/>

'use strict';

module ascii_draw {
    export module controllers {
        import Rectangle = utils.Rectangle;
        import CellPosition = utils.Point;
        import Cell = grid.Cell;

        export interface Controller {
            activate(): void;
            deactivate(): void;
            onMouseDown(target: Cell): void;
            onMouseUp(target: Cell): void;
            onMouseOver(pos: CellPosition): void;
            onArrowDown(displacement: Array<number>): void;
            onKeyPress(character: string): void;
        }

    }
}
