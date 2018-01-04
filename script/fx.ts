interface Character {
    content: string;
    special: boolean;
    color?: string;
    link?: string;
    proper?: Character;
    callback?: Function;
}

interface GridDimensions {
    cols: number;
    rows: number;
}

interface CharacterGrid {
    grid: [ Character[] ];
    dimensions: GridDimensions;
}

function createGrid(): CharacterGrid {
    const grid: CharacterGrid = {
        grid: [ [] ],
        dimensions: findGridDimensions()
    };

    return grid;
}

function populateGrid( grid: CharacterGrid ) {
    for( let row: number = 0; row < grid.dimensions.rows; ++row ) {
        grid.grid[ row ] = [];

        for( let col: number = 0; col < grid.dimensions.cols; ++col ) {
            grid.grid[ row ].push( {
                content: getRandomCharacter(),
                special: false
            } );
        }
    }

    drawGrid( grid );
}


/**
 * Clear special content from one row.
 */
function clearRow( grid: CharacterGrid, row: number ) {
    const promise = $.Deferred();

    for( let col: number = 0; col < grid.dimensions.cols; ++col ) {
        if( grid.grid[ row ][ col ].special ) {
            grid.grid[ row ][ col ] = {
                content: getRandomCharacter(),
                special: false
            };

            setTimeout( () => revertChar( grid, row, col ), Math.random() * 1000 );
        }
    }

    setTimeout( () => promise.resolve(), 1000 );    // it takes at most 1 second for all the characters to revert

    return promise;
}


/**
 * Draw the grid on the screen.
 */
function drawGrid( grid: CharacterGrid ) {
    let $previousRow = $( "main > div:first" );
    let $previousCol;

    if( $previousRow.length === 0 ) {
        $previousRow = $( '<div id="#row0">' ).appendTo( "main" );
    }

    for( let row: number = 0; row < grid.dimensions.rows; ++row ) {
        let $row = $( '#row' + row );

        if( $row.length === 0 ) {
            // row doesn't exist, create it

            $row = $( `<div class="row" id="row${row}"><span class="col col0"></span></div>` );
            $previousRow.after( $row );
            $previousCol = $row.find( '.col0' );
        }

        for( let col: number = 0; col < grid.dimensions.cols; ++col ) {
            let char: Character = grid.grid[ row ][ col ];
            let $col = $row.find( '.col' + col );

            if( $col.length === 0 ) {
                // column doesn't exist, create it

                $col = $( `<span class="col${col}">&nbsp;</span>` );
                $previousCol.after( $col );
            }

            if( $col.text() !== char.content ) {
                $col.text( char.content );
            }

            if( $col.data( 'color' ) !== char.color ) {
                $col.css( 'color', char.color );
                $col.data( 'color', char.color );
            }

            $previousCol = $col;
        }

        $previousRow = $row;
    }
}


/**
 * Calculate the visible dimensions of the grid on the screen.
 *
 * @return {GridDimensions}
 */
function findGridDimensions(): GridDimensions {
    const $test = $( '<div id="dimensiontest">x</div>' ).appendTo( 'main' );
    const initialHeight: number = $test.height();
    const windowHeight: number = $( window ).height();
    const dimensions: GridDimensions = { cols: 0, rows: 0 };

    while( $test.height() === initialHeight && dimensions.cols < 2000 ) {
        $test.text( $test.text() + 'x ' );
        dimensions.cols += 2;
    }

    $test.empty();

    while( $test.height() < windowHeight && dimensions.rows < 2000 ) {
        $test.html( $test.html() + 'x<br>' );
        dimensions.rows++;
    }

    dimensions.rows++;

    $test.remove();

    return dimensions;
}


/**
 * Returns a single random character.
 *
 * @return {string}
 */
function getRandomCharacter(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz1234567890+-!?.,\xa0".split( '' );     // \xa0 is non-breaking space

    let randomChar: string = chars[ Math.floor( Math.random() * chars.length ) ];

    if( Math.random() < 0.1 ) {
        randomChar = randomChar.toUpperCase();
    }

    return randomChar;
}


/**
 * Put some actual text into the grid.
 */
function insertText( grid: CharacterGrid, text: string, row: number, column: number, color: string, callback?: Function ) {
    const TEXT_APPEAR_ANIMATION_DURATION = 1000;
    const promise = $.Deferred();

    for( let i = 0, r = row, c = column; i < text.length; ++i, ++c ) {
        if( text[ i ] === '\n' ) {
            r++;
            c = column - 1;
            continue;
        }

        grid.grid[ r ][ c ] = {
            content: text[ i ],
            color,
            special: true,
            callback
        };

        grid.grid[ r ][ c ].proper = Object.assign( {}, grid.grid[ r ][ c ] );

        setTimeout( () => revertChar( grid, r, c ), Math.random() * TEXT_APPEAR_ANIMATION_DURATION );
    }

    setTimeout( () => promise.resolve(), TEXT_APPEAR_ANIMATION_DURATION );

    return promise;
}


/**
 * Remove all actual text from the grid.
 *
 * @param {CharacterGrid} grid
 * @param {number} duration The time until the callback is called. The animation takes 1000 ms.
 * @returns {JQuery.Deferred<any, any, any>}
 */
function removeSpecials( grid: CharacterGrid, duration: number = 1000 ) {
    const promise = $.Deferred();

    for( let row: number = 0; row < grid.dimensions.rows; ++row ) {
        clearRow( grid, row );
    }

    setTimeout( () => promise.resolve(), duration );

    return promise;
}

/**
 * Revert a randomly changed character to its "proper" form.
 *
 * @param grid
 * @param row
 * @param col
 */
function revertChar( grid: CharacterGrid, row: number, col: number ) {
    if( grid.grid[ row ][ col ].proper ) {
        grid.grid[ row ][ col ] = Object.assign( {}, grid.grid[ row ][ col ].proper );
        grid.grid[ row ][ col ].proper = Object.assign( {}, grid.grid[ row ][ col ] );
    }

    updateChar( grid, row, col );
}


/**
 * Update one character in the grid.
 *
 * @param grid
 * @param char
 * @param row
 * @param col
 */
function updateChar( grid: CharacterGrid, row: number, col: number ) {
    const char = grid.grid[ row ][ col ];
    const $cell = $( `#row${row} .col${col}` );

    $cell.empty();
    $cell.css( 'color', char.color || '' ).data( 'color', char.color );

    if( char.callback ) {
        const $link = $( '<a href="#">' + char.content + '</a>' ).on( 'click', function( e ) {
            e.preventDefault();
            char.callback();
        });

        $cell.append( $link );
    }
    else {
        $cell.text( char.content );
    }
}


/**
 * Changes some characters in the character grid at random.
 *
 * @param grid
 */
function updateGrid( grid: CharacterGrid ) {
    const chars = grid.dimensions.rows * grid.dimensions.cols * 0.002;

    for( let i: number = 0; i < chars; ++i ) {
        const row: number = Math.floor( Math.random() * grid.dimensions.rows );
        const col: number = Math.floor( Math.random() * grid.dimensions.cols );

        grid.grid[ row ][ col ].content = getRandomCharacter();
        grid.grid[ row ][ col ].color = '';

        updateChar( grid, row, col );

        if( grid.grid[ row ][ col ].proper ) {
            setTimeout( () => {
                revertChar( grid, row, col );
            }, 300 );
        }
    }
}


export { createGrid, populateGrid, updateGrid, insertText, removeSpecials, clearRow, getRandomCharacter };