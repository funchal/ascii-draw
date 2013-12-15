'use strict';

module ascii_draw
{
    export module modes
    {
        export interface Mode
        {
            activate(): void;
            deactivate(): void;
        }

        export module SelectMoveMode
        {
            export function activate(): void
            {
                utils.addClass(selection_button, 'pressed');
            }

            export function deactivate(): void
            {
                utils.removeClass(selection_button, 'pressed');
            }
        }

        export module RectangleMode
        {
            export function activate(): void
            {
                utils.addClass(rectangle_button, 'pressed');
            }

            export function deactivate(): void
            {
                utils.removeClass(rectangle_button, 'pressed');
            }
        }

        var selection_button: HTMLButtonElement;
        var rectangle_button: HTMLButtonElement;

        export var current: Mode = SelectMoveMode;

        function change(new_mode: Mode): void
        {
            current.deactivate();
            current = new_mode;
            current.activate();
        }

        export function init(): void
        {
            rectangle_button =
                <HTMLButtonElement>document.getElementById('rectangle-button');
            selection_button =
                <HTMLButtonElement>document.getElementById('selection-button');

            current.activate();
            selection_button.addEventListener('click',
                change.bind(undefined, SelectMoveMode), false);
            rectangle_button.addEventListener('click',
                change.bind(undefined, RectangleMode), false);
        }
    }
}
