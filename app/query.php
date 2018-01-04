<?php
try {
    $title = $_GET[ 'title' ];

	// save the title to a file for statistics
    file_put_contents( 'all_queries.txt', "$title\n", FILE_APPEND );

	// search an article from Wikipedia
    $response = file_get_contents( "https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&titles=".urlencode($title)."&format=json&explaintext&redirects&inprop=url" );

    $data = json_decode( $response, TRUE );

	// if there's no data, Wikipedia is down, the API format has changed or the query failed for some other reason
    if( !$data || !array_values( $data['query']['pages'] ) ) {
        echo json_encode( array( 'title' => $title, 'error' => 'invalidresponse' ) );
        die();
    }

	// if there's no extract an article with that title wasn't found
    if( empty( array_values( $data['query']['pages'] )[0]['extract'] ) ) {
        echo json_encode( array( 'title' => $title, 'error' => 'notfound' ) );
        die();
    }

	// removes sentences that are unlikely to be full sentences
    function cleanup( $str ) {
        $str = trim( $str );

        if( $str === "" ) {
            return false;
        }

        $lastchar = substr( $str, -1 );

        if( $lastchar === ":" ) {
            return false;
        }

        return true;
    }

    $title = array_values( $data['query']['pages'] )[0]['title'];
    $extract = array_values( $data['query']['pages'] )[0]['extract'];
    $sentences = preg_split( "/(?<=[\n\.!\?])/", $extract );
    $sentences = array_filter( $sentences, "cleanup" );

	// no article content found in the response
    if( count( $sentences ) === 0 ) {
        echo json_encode( array( 'title' => $title, 'error' => 'nocontent' ) );
        die();
    }

	// choose a random sentence from the article extract
    $pick = trim( $sentences[ array_rand( $sentences, 1 ) ] );

	// don't send content that's too short
    if( strlen( $pick ) < 10 ) {
        echo json_encode( array( 'title' => $title, 'error' => 'tooshort' ) );
        die();
    }

	// save the player's query for later processing
    file_put_contents( 'successful_queries.txt', "$title\n", FILE_APPEND );

	// send the data to the frontend
    echo json_encode( array( 'title' => $title, 'extract' => $pick ) );
} catch( Exception $e ) {
    echo 'null';
}