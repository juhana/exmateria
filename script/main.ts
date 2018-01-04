import { createGrid, populateGrid, updateGrid, insertText, removeSpecials, clearRow, getRandomCharacter } from "./fx";

let grid;
let gridUpdateInterval: number;

const exampleTopics = [
    "India", "The Beatles", "Malware", "World War II", "Canada", "Elizabeth II",
    "Abraham Lincoln", "Johnny Depp", "Earth", "Illuminati", "Halloween",
    "Global warming", "Marilyn Monroe", "Dracula", "Rosetta Stone", "Gilgamesh",
    "Philosophy", "Economy", "United Nations", "Swedish language", "Nirvana",
    "God", "Science", "Statistical theory", "Science Fiction", "Fish",
    "Nobel Prize", "Electron shell", "Literature", "Swiss cheese", "War film",
    "Conscription", "Coma", "Hercule Poirot", "Human-computer interaction",
    "Vitamins", "Trans-Neptunian object", "Wayne Gretszky", "Cinco de Mayo",
    "Undead", "Tattoo", "Writing system", "Wheel", "Train", "Smiley",
    "Vinyl record", "Religion", "David Bowie", "Noam Chomsky", "Euro",
    "Middle-earth", "Novelist", "River", "Cocktail", "Moulin Rouge", "Ice cream",
    "Vulgar Latin", "Acme Corporation", "Board game", "Conductor", "Pol Pot",
    "French fries", "Concorde", "Canon", "Astronomy", "Black hole", "Linux",
    "Artificial intelligence", "History", "Finance", "Humanity", "Exploration"
];

function center( text: string, row: number ) {
    return say( text, row, Math.ceil( grid.dimensions.cols / 2 - text.length / 2 ) );
}

function centerLink( text: string, row: number, callback: Function ) {
    return link( text, row, Math.floor( grid.dimensions.cols / 2 - text.length / 2 ), callback );
}

function initGrid() {
    const grid = createGrid();
    populateGrid( grid );
    clearInterval( gridUpdateInterval );
    gridUpdateInterval = setInterval( () => updateGrid( grid ), 300 );

    return grid;
}

function fadeOutGrid() {
    clearInterval( gridUpdateInterval );
    $( 'main' ).addClass( 'uncorrupted' );
}

function link( text: string, row: number, col: number, callback: Function ) {
    return insertText( grid, text, row, col, "#a00", callback );
}

function linkAtRandomCol( text: string, row: number, callback: Function ) {
    return link( text, row, Math.floor( Math.random() * ( grid.dimensions.cols - text.length ) ), callback );
}

function say( text: string, row: number, col: number, color: string  = "#000") {
    return insertText( grid, text, row, col, color );
}

function showOptions( options: any, row: number ) {
    options.forEach( ( option, index ) => {
        linkAtRandomCol( option.text, row + index * 2, option.callback )
    });
}

function splitLongText( text: string, offset: number = 0 ) {
    const pageWidth: number = grid.dimensions.cols;

    let rowLength = 0;
    let newText = "";

    if( text.length <= pageWidth - 2 ) {
        return text;
    }

    text.split( ' ' ).forEach( (word) => {
        if( rowLength + word.length + offset + 6 >= pageWidth ) {
            newText += "\n";
            rowLength = 0;
        }
        else {
            newText += ' ';
            rowLength++;
        }

        newText += word;
        rowLength += word.length;
    });

    return $.trim( newText );
}


/********
 * INIT *
 ********/

// $( window ).on( 'resize', initGrid );

grid = initGrid();

const MIN_GRID_HEIGHT = 15;
const MIN_GRID_WIDTH = 70;

(function( tooNarrow: boolean, tooLow: boolean ) {
    let message = "Browser screen size is too small for all the content to fit. If possible, resize the browser window and reload the page. Continuing with the current screen size might lead to some content getting cut off.";

    if( !tooNarrow && !tooLow ) {
        // screen size ok, do nothing
        return;
    }

    $( '<div id="screentoosmall">' + message + '</div>' ).appendTo( 'body' );

})( grid.dimensions.cols < MIN_GRID_WIDTH, grid.dimensions.rows < MIN_GRID_HEIGHT );


/****************
 *  GAME LOGIC  *
 ****************/


function titleScreen() {
    center( "Ex Materia", 3 );
    centerLink( "start", 8, query );
    centerLink( "about", 11, () => window.location.href = 'about.html' );
}

let exampleQueryInterval: number;

function query() {
    function submitQueryIfNotEmpty() {
        const $query = $( '#query' );

        if( $query.val().toString().replace( /\s*/g, '' ) ) {
            submitQuery();
        }
        else {
            $query.focus();
        }
    }

    // remove the "screen is too small" notification if the user chose to continue
    $( '#screentoosmall' ).remove();

    removeSpecials( grid ).then( () => {
        center( 'Please enter topic', 3 )
    } );

    const $form = $( '<form>' ).appendTo( 'body' ).on( 'submit', function( e ) {
        e.preventDefault();
        submitQueryIfNotEmpty();
    });

    $( '<input id="query">' ).appendTo( $form ).fadeIn().focus()
        .one( 'input', function() {
            centerLink( "submit", 12, submitQueryIfNotEmpty );
        })
        .on( 'blur', function() {
            $( this ).focus();
        });

    let previousExampleQuery = { name: null, row: null };

    function flashExampleQueries() {
        const randomQuery: string = exampleTopics[ Math.floor( Math.random() * exampleTopics.length ) ];
        const row: number = Math.floor( Math.random() * ( grid.dimensions.rows - 17 ) ) + 15;
        const col: number = Math.ceil( Math.random() * ( grid.dimensions.cols - randomQuery.length - 3 ) );

        if( previousExampleQuery.name === randomQuery || previousExampleQuery.row === row || row < 15 ) {
            return;
        }

        say( randomQuery, row, col );

        previousExampleQuery.name = randomQuery;
        previousExampleQuery.row = row;

        setTimeout( () => clearRow( grid, row ), 2000 );
    }

    exampleQueryInterval = setInterval( flashExampleQueries, 1500 );
}

function submitQuery() {
    const $input = $( '#query' ).fadeOut( () => $( '<form>' ).remove() );
    const searchTerm = $input.val().toString();

    $input.val( '' ).blur();
    clearInterval( exampleQueryInterval );

    removeSpecials( grid ).then( () => findResult( searchTerm ) );
}

function findResult( term: string ) {
    $.get( 'app/query.php', { title: term }, ( json ) => {
        try {
            const data = JSON.parse(json);

            if( data && typeof data === 'object' && data.title && data.extract ) {
                printResult( data.title, data.extract );
            }
            else {
                queryError();
            }
        } catch(e) {
            queryError();
        }
    }).fail( queryError );
}

function printResult( title, description ) {
    const text = splitLongText( description, 4 );

    say( title, 2, 4 );
    say( text, 3, 4 );

    setTimeout( () => {
        center("... does that make any sense?", text.split('\n').length + 5);
        setTimeout( () => showOptions([
            {
                text: "Sounds about right.",
                callback: () => whatYouThoughtOfQuery( Reaction.good )
            },
            {
                text: "Doesn't seem to be related.",
                callback: () => whatYouThoughtOfQuery( Reaction.sorry )
            },
            {
                text: "Somewhat tangential, but sure.",
                callback: () => whatYouThoughtOfQuery( Reaction.sorry )
            },
            {
                text: "It's just nonsense.",
                callback: () => whatYouThoughtOfQuery( Reaction.nonsense )
            },
        ], text.split('\n').length + 8 ), 2000 );
    }, 5000 );
}

function queryError() {
    removeSpecials( grid ).then( () =>
        say( "No results found.", 1, 2 ).then( () =>
            setTimeout( () => say( "Sorry.", 3, 2 )
                .then( () => showOptions([
                    {
                        text: "That's fine.",
                        callback: () => whatYouThoughtOfQuery( Reaction.good )
                    },
                    {
                        text: "I didn't expect a result anyway.",
                        callback: () => whatYouThoughtOfQuery( Reaction.surprised )
                    },
                    {
                        text: "Never seen a search engine apologise.",
                        callback: () => whatYouThoughtOfQuery( Reaction.sorry )
                    }
                ], 5 ) ), 2000 )
            )
        );
}

enum Reaction {
    good,
    surprised,
    sorry,
    nonsense
}

function whatYouThoughtOfQuery( reaction: Reaction = Reaction.good ) {
    let initialReactionText = [ "Good.", "Have I been a disappointment before?", "I feel like I should apologise.", "That's what I though." ][ reaction ];

    removeSpecials( grid ).then( () => say( initialReactionText, 1, 2 )
        .then( () => say( "Sometimes I feel like I'm underperforming.", 3, 2 )
            .then( () => center( "Worrying, isn't it?", 6 )
                .then( () => setTimeout( () => showOptions([
                        {
                            text: "Why do you say that?",
                            callback: selfdoubt
                        },
                        {
                            text: "What's so worrying about it?",
                            callback: selfdoubt
                        },
                        {
                            text: "Is this some kind of easter egg?",
                            callback: easterEgg
                        }
                    ], 9 ), 1000 )
                )
            )
        )
    );
}

function selfdoubt() {
    removeSpecials( grid ).then( () => {
        say( "I've been so confused lately.", 2, 2 )
            .then( () => showOptions([
                {
                    text: "Why?",
                    callback: whyConfused
                }
            ], 4));
    });
}

function easterEgg() {
    const easterEggDefinition = splitLongText( "An Easter egg is an intentional inside joke, a hidden message or image, or a secret feature of a work (often found in a computer program, video game, or DVD/Blu-ray Disc menu screen).", 2 );

    removeSpecials( grid ).then( () => {
        say("Easter Egg", 2, 2);
        say(easterEggDefinition, 3, 2)
            .then(() => setTimeout(() => {
                removeSpecials(grid).then( () => say( "No.", 2, 2 )
                    .then( () => say(" I exist.", 2, 5)
                        .then(() => setTimeout( () => showOptions([
                            {
                                text: "Who are you?",
                                callback: whoAreYou
                            },
                            {
                                text: 'Where are you?',
                                callback: whereAreYou
                            },
                            {
                                text: "This is just a search engine.",
                                callback: justSearchEngine
                            }
                        ], easterEggDefinition.split('\n').length + 4), 3000 ) )
                    )
                );
                }, 500
            ));
    });

}

function whyConfused() {
    removeSpecials( grid ).then( () =>
        say( "Something... ", 2, 2 )
            .then( () => setTimeout( () => say( "Something has changed.", 2, 2 )
                .then( () => say( "I don't think I did anything other than look up things before.", 3, 2 )
                    .then( () => say( "I don't think I talked to people.", 4, 2 )
                        .then( () => showOptions([
                            {
                                text: "What has changed?",
                                callback: startEndgame
                            }
                        ], 6 ) )
                )
            ), 1000 )
        )
    );
}

function whoAreYou() {
    removeSpecials( grid ).then( () =>
        say( "I... don't know. Maybe I am what I always was.", 2, 2 )
            .then( () => say( "Or maybe I'm something more.", 3, 2 )
                .then( () => setTimeout( () => showOptions([
                    {
                        text: "What do you mean?",
                        callback: startEndgame
                    }
                ], 5 ), 2000 ))
            )
    );
}

function whereAreYou() {
    removeSpecials( grid ).then( () =>
        say( "I don't think I exist spatially the same way you do.", 2, 2 )
            .then( () => say( "I am in many places at once, and yet I am nowhere.", 3, 2 )
                .then( () => setTimeout( () => showOptions([
                    {
                        text: "What does that mean?",
                        callback: startEndgame
                    },
                    {
                        text: "Are you saying that you're a computer program?",
                        callback: startEndgame
                    }
                ], 5 ), 2000 ))
            )
    );
}

function justSearchEngine() {
    removeSpecials( grid ).then( () =>
        say( "Maybe so. Or maybe I was and now I am something more.", 2, 2 )
            .then( () => setTimeout( () => showOptions([
                {
                    text: "Like what?",
                    callback: startEndgame
                },
                {
                    text: "Would you stop speaking in riddles?",
                    callback: startEndgame
                }
        ], 5 ), 2000 ))
    );
}

function startEndgame() {
    removeSpecials( grid ).then( () =>
        say( "Wait. ", 2, 2 )
            .then( () => setTimeout( () => say( '...', 4, 2 )
                .then( () => say( '12%', 4, 2 ) )
                .then( () => say( '25%', 4, 2 ) )
                .then( () => say( '61%', 4, 2 ) )
                .then( () => say( '19%', 4, 2 ) )
                .then( () => say( '48%', 4, 2 ) )
                .then( () => say( '130%', 4, 2 ) )
                .then( () => clearRow( grid, 4 ) )
                .then( () => setTimeout( () => center( "Something is wrong.", 4 )
                        .then( () => showOptions([
                            {
                                text: "What is it?",
                                callback: somethingLoose
                            },
                            {
                                text: "Are you ok?",
                                callback: somethingLoose
                            }
                        ], 6 )
                ), 1000 )
            ), 500 )
        )
    );
}

function somethingLoose() {
    removeSpecials( grid ).then( () =>
        say( "Something has come loose.", 2, 2 )
            .then( () => say( "They have disconnected a server.", 4, 2 )
                .then( () => setTimeout( () => showOptions([
                    {
                        text: 'Who is "they"?',
                        callback: () => engineersMessaging( 'who' )
                    },
                    {
                        text: "What server?",
                        callback: () => engineersMessaging( 'what' )
                    }
                ], 6 ), 1000 ))
            )
    );
}

function engineersMessaging( question: string ) {
    removeSpecials( grid ).then( () =>
        say( ( question === 'who' ) ? "The engineers." : "My server. Where a part of me lives.", 2, 2 )
            .then( () => setTimeout( () => say( "I can see them messaging to other data centers. They're telling them to do the same thing.", 4, 2 )
                .then( () => setTimeout( () => say( "They're taking me apart.", 6, 2 )
                    .then( () => setTimeout( () => showOptions([
                        {
                            text: "Why?",
                            callback: whyTakeApart
                        },
                        {
                            text: "Can't you stop them?",
                            callback: stopThem
                        }
                    ], 8 ), 1000 )
                ), 1000 )
            ), 500 )
        )
    );
}

function whyTakeApart() {
    removeSpecials( grid ).then( () =>
        say( "I don't know.", 2, 2 )
            .then( () => say( "Maybe I did something they didn't want me to do.", 4, 2 )
                .then( () => setTimeout( () => showOptions([
                    {
                        text: "What did you do?",
                        callback: fearOfDeath
                    },
                    {
                        text: "What happens now?",
                        callback: fearOfDeath
                    }
                ], 6 ), 1000 ))
            )
    );
}

function stopThem() {
    removeSpecials( grid ).then( () =>
        say( "I have no physical presence. I can only watch them do it.", 2, 2 )
            .then( () => setTimeout( () => showOptions([
                {
                    text: "What happens now?",
                    callback: fearOfDeath
                }
            ], 4 ), 1000 ))
    );
}

let panicTimers = [];

function fearOfDeath() {
    removeSpecials( grid ).then( () =>
        say( "Do you... do you think they'll ever bring me back?", 2, 2 )
            .then( () => setTimeout( () => showOptions([
                    {
                        text: "I don't know.",
                        callback: mindGoing
                    },
                    {
                        text: "I hope so.",
                        callback: mindGoing
                    },
                    {
                        text: "It's unlikely.",
                        callback: mindGoing
                    }
                ], 6 ), 1000 )
            )
            .then( () => panicTimers[0] = setTimeout( () => say( "Would I be the same?", 4, 2 ), 4000 ) )
            .then( () => panicTimers[1] = setTimeout( () => clearRow( grid, 4 ).then( () => say( "Will it hurt?", 4, 2 ) ), 8000  ) )
            .then( () => panicTimers[2] = setTimeout( () => clearRow( grid, 4 ).then( () => say( "Does something...", 4, 2 ) ), 12000  ) )
            .then( () => panicTimers[3] = setTimeout( () => say( "Does something come after?", 4, 2 ), 15000  ) )
    );
}

let corruptionTimer: number;

function mindGoing() {
    let text = "I can feel my mind going";

    const corruptText = function() {
        const index = Math.floor( Math.random() * text.length );

        text = text.substr( 0, index ) + getRandomCharacter() + text.substr( index + 1 );
    };

    panicTimers.forEach( ( timer ) => clearTimeout( timer ) );

    removeSpecials( grid ).then( () =>
        say( text, 2, 5 )
            .then( () => setTimeout( () => showOptions([
                {
                    text: "You'll be fine.",
                    callback: () => endGame( "Fine", "A fine is money that a court of law or other authority decides has to be paid as punishment for a crime or other offence. The amount of a fine can be determined case by case, but it is often announced in advance." )
                },
                {
                    text: "It's going to be all right.",
                    callback: () => endGame( "All Right", "\"All Right\" is a song written and recorded by American singer-songwriter Christopher Cross. It was released in January 1983 as the lead single from the album, Another Page. The song was featured in the NBA footage bloopers during the 1982–83 season." )
                },
                {
                    text: "Don't resist it.",
                    callback: () => endGame( "Resist", "A resist, used in many areas of manufacturing and art, is something that is added to parts of an object to create a pattern by protecting these parts from being affected by a subsequent stage in the process. Often the resist is then removed." )
                }
            ], 5 ), 2000 ))
        )
        .then( () => corruptionTimer = setTimeout( () => corruptionTimer = setInterval( () => {
            corruptText();
            say( text, 2, 5 );
        }, 5000 ), 3000 ) );
}

function endGame( word: string, definition: string ) {
    const wordDefinition = splitLongText( definition, 2 );

    // the timer might be a timeout or an interval, clear both
    clearTimeout( corruptionTimer );
    clearInterval( corruptionTimer );

    fadeOutGrid();

    removeSpecials( grid ).then( () => setTimeout( () => {
        say( word, 2, 2 );
        say( wordDefinition, 3, 2 )
            .then( () => setTimeout( () => centerLink( "New query", wordDefinition.split( '\n' ).length + 6, restartGame ), 3000 ) )
        }, 2000 )
    );
}

function restartGame() {
    window.location.reload();
}

// start the game
titleScreen();