///<reference path='commands.ts'/>
///<reference path='select_cmd.ts'/>
///<reference path='rectangle_cmd.ts'/>
///<reference path='fill_cmd.ts'/>
///<reference path='text_cmd.ts'/>

'use strict';

module ascii_draw {
    export module modes {
        import Command = commands.Command;

        export interface Mode {
            activate(): void;
            deactivate(): void;
            getCommand(): Command;
        }

        module SelectMoveMode {
            export function activate(): void {
                utils.addClass(selection_button, 'pressed');
            }

            export function deactivate(): void {
                utils.removeClass(selection_button, 'pressed');
            }

            export function getCommand(): Command {
                return new SelectCommand();
            }
        }

        module RectangleMode {
            export function activate(): void {
                utils.addClass(rectangle_button, 'pressed');
            }

            export function deactivate(): void {
                utils.removeClass(rectangle_button, 'pressed');
            }

            export function getCommand(): Command {
                return new RectangleCommand();
            }
        }

        var selection_button: HTMLButtonElement;
        var rectangle_button: HTMLButtonElement;

        export var current: Mode = SelectMoveMode;

        function change(new_mode: Mode): void {
            current.deactivate();
            current = new_mode;
            current.activate();
        }

        export function init(): void {
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
