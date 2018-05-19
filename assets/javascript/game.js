
// Initialize Firebase
var config = {
    apiKey: "AIzaSyCz7jP2oY04S6IeOiwQs6gs9MLuFhbK5Uk",
    authDomain: "rps-multiplayer-2c7aa.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-2c7aa.firebaseio.com",
    projectId: "rps-multiplayer-2c7aa",
    storageBucket: "",
    messagingSenderId: "234736765783"
};

firebase.initializeApp(config);
var database = firebase.database();
var player_ref = database.ref("players/");

var in_game = false;
var my_name = "";
var my_win = 0;
var my_lose = 0;
var my_tie = 0;
var my_choice = "";
var enemy = "";
var enemy_choice = "";
var my_enemy_key = null;
var my_key = player_ref.push().getKey();;
var wait_time;
var flashInterval = null;

function printChoice(id){
    $(id).empty()
    $(id).append("<button class='list-group-item my_choice'>Rock</button>");
    $(id).append("<button class='list-group-item my_choice'>Paper</button>");
    $(id).append("<button class='list-group-item my_choice'>Scissors</button>");
}

function printScore(id,win,lose,tie){
    $(id).empty();
    $(id).text("Wins: " + win + "    Loses: "+ lose + "   Tie: " + tie );
}

function printPlayersChoices(){
    $("#player1_choice .my_choice").css("background-color", "lightblue");
    $("#game_result").empty();
    $("#game_result").append("<h6>Your choice: "+my_choice+"</h>")
    $("#game_result").append("<h6>"+enemy +"'s choice: "+enemy_choice+"</h>")
}

// check who wins the game when both players made a choice
function checkWhoWin(){
    printPlayersChoices();

    // compare choices
    var r1 = my_choice === "Rock" && enemy_choice == "Paper";
    var r2 = my_choice === "Paper" && enemy_choice == "Scissors";
    var r3 = my_choice === "Scissors" && enemy_choice == "Rock";
    var r4 = my_choice === enemy_choice;

    if(r1 || r2 || r3){
        $("#game_result").append("<h5>"+enemy+" won!</h5>")
        my_lose += 1;
    }else if(r4){
        $("#game_result").append("<h5>No one won!</h5>");
        my_tie += 1;
    }else{
        $("#game_result").append("<h5>"+my_name+" won!</h5>")
        my_win += 1;
    }

    printScore("#player1_result",my_win,my_lose,my_tie);
    printScore("#player2_result",my_lose,my_win,my_tie);
    // clean up
    enemy_choice = "";
    my_choice = "";
    database.ref("players/"+my_key).update({choice:""});
}

// check if there is a new message from player2
function checkNewMessage(){
    database.ref("players/"+my_enemy_key+"/message").on("value",function(snapshot){
        var message = snapshot.val()
        if(message !== null && message !== ""){
            $("#dialogue").append("<p>"+enemy+": "+message+"</p>");           
            $('#dialogue').css("border",'Tomato .3em solid');        
        }
    })
}

// check who is available and print at most 4 out
function checkWhoIsavailable(){
    player_ref.orderByChild("waitTime").limitToLast(4).once("value",function(snapshot){
        var data = snapshot.val();
        if(data != null){
            var keys = Object.keys(data);
            if(keys.length > 1){
                $("#player2_choice").append("<p>Available players:</p>");
            }

            // print available players except myself
            for(var i=0; i<keys.length; i++){
                var key = keys[i]; 
                if(data[key].name != my_name && data[key].enemy === ""){ 
                    $("#player2_choice").append("<button class='list-group-item nextPlayer'>"+data[key].name+"</button>");
                }
            }
        }
    })
}

// remove player2 if offline and tell player1 who is available 
function enemyOfflineHandle(){
    database.ref("players/"+my_enemy_key).on('value', function(snapshot) {     
        if (snapshot.val() === null && enemy !== "") {
            database.ref("players/"+my_enemy_key).remove();
            $("#player2_name").text(enemy + " has left the game!");
            $("#player2_choice").empty();
            $("#player2_result").empty();
            $("#game_result").empty();
            database.ref("players/"+my_key).update({enemy:"",
                                                    waitTime:moment().format("X"),
                                                    message:""});

            // reset variables
            enemy = "";
            enemy_choice = "";
            my_enemy_key = null;
            in_game = false;

            // check who is available 
            checkWhoIsavailable();
        }
    });
}

// check if we have update in enemy property
function checkIfHaveEnemy(){
    database.ref("players/"+my_key+"/enemy").on("value",function(snapshot){
        var data = snapshot.val();
        if(data !== ""){
            player_ref.orderByChild("name").equalTo(data).once("value",function(snap){
                my_enemy_key = Object.keys(snap.val())[0];
                var enemy_data = snap.val()[my_enemy_key];
                
                if(enemy_data !== null && (enemy_data.enemy === "" || enemy_data.enemy === my_name)){
                    wait_time = Number.MAX_VALUE;
                    database.ref("players/"+my_enemy_key).update({enemy: my_name, waitTime: wait_time});

                    // render player2's choice and score
                    enemy = enemy_data.name;
                    $("#player2_name").text(enemy);
                    printChoice("#player2_choice");
                    printScore("#player2_result",my_lose,my_win,my_tie);
                    $("#dialogue").empty();

                    // check if there is a new message from player2
                    checkNewMessage();

                    database.ref("players/"+my_enemy_key+"/choice").on("value",function(snapshot){
                        enemy_choice = snapshot.val();
                        if(enemy_choice !== "" && my_choice !== ""){
                            checkWhoWin();
                        }
                    })

                    // handle enemy offline event
                    enemyOfflineHandle();
                }else{
                    $("#player2_choice").append("<p>Sorry,"+data+" is not available!")
                }
            })
        }       
    })
}

// check if anyone is waiting to play game
function checkIfSomeoneWaiting(data){
    if(data !== null){ // if there is someone waiting to play game
        var key = Object.keys(data)[0];
        if(data[key].enemy === ""){  // if the returned player isn't playing with someone
            my_enemy_key = key;
            enemy = data[my_enemy_key].name;
            wait_time = Number.MAX_VALUE;

            // set myself as the enemy of the returned player and waitTime to min integer 
            database.ref("players/"+my_enemy_key).update({enemy: my_name, waitTime: wait_time});                                 
        }
    } 
}

// check database and render player1's choice and score
function initPlayer1Game(){
    database.ref("players/"+my_key).on("value",function(snapshot){
        var data = snapshot.val()
        if(data !== null){
            if(!in_game){
                $("#player1_name").text(data.name);
                printChoice("#player1_choice");
                printScore("#player1_result",my_win,my_lose,my_tie);
            }
            in_game = true;
        }
    })
}

// save player1's info into database
function savePlayer1Info(){
    var player1_info = { 
        name: my_name,
        enemy: enemy,
        waitTime: wait_time,
        choice: "",
        online: true,
        message: ""
    }
    database.ref("players/"+my_key).update(player1_info);
}

// handle player1 offline event
function handlePlayer1Offline(){
    database.ref("players/"+my_key+"/online").on('value', function(snapshot) {
        if (snapshot.val()) { database.ref("players/"+my_key).onDisconnect().remove(); }               
    });
}

$("document").ready(function(){

    // handle startBnt click
    $("#startBnt").on("click",function(){
        // set wait_time to current time, player1 start
        wait_time = moment().format("X");
        var name = $("#player_name").val().trim();
        if( !in_game && name !== ""){ // if we are not in a middle of a game and name input is not empty
            
            // check if user name has been used. If yes, alert user name has been used. If not, setup game
            player_ref.orderByChild("name").equalTo(name).once("value",function(snapshot){
                if(! snapshot.val()){ // if user name is not existing                   
                    my_name = name;

                    // find player who waits for the longest
                    player_ref.orderByChild("waitTime").limitToLast(1).once("value",function(snapshot){                       
                        // check if anyone is waiting to play game
                        checkIfSomeoneWaiting(snapshot.val());
                
                        // save player1's info into database
                        savePlayer1Info();

                        // check if we have update in enemy property
                        checkIfHaveEnemy();
                                            
                        // check database and render player1's choice and score
                        initPlayer1Game();

                        // check if player1 makes a choice
                        database.ref("players/"+my_key+"/choice").on("value",function(snapshot){
                            my_choice = snapshot.val();
                            if(my_choice !== "" && enemy_choice !== ""){ // if player2 has made a choice
                                checkWhoWin();
                            };
                        })

                        // handle player1 offline event
                        handlePlayer1Offline();

                         // clear the start input
                         $("#player_name").val("");
                    })              
                }else{  // if player name is already existed
                    alert("This user name has been used by other player!")
                }       
            })              
        }
    })

    // when player1 make a choice, save choice to database
    $("#player1_choice").on("click",".my_choice",function(){
        if(my_choice === "" && enemy !== ""){ // if player1 never make a choice and has enemy
            $(this).css('background-color','red')
            $("#game_result").empty();

            my_choice = $(this).text();
            database.ref("players/"+my_key).update({choice:my_choice});
        }
    })

    // when player1 can select his/her enemy, set this person as his/her enemy 
    $("#player2_choice").on("click",".nextPlayer",function(){   
        wait_time = Number.MAX_VALUE;
        database.ref("players/"+my_key).update({enemy:$(this).text(),waitTime: wait_time});
    })
    
    // When message's summit button is clicked, send message to player2
    $("#sendBnt").on("click",function(event){
        event.preventDefault();
        var message = $("#my_message").val().trim();

        if(message !== "" && my_enemy_key !== null){ // if message is not empty and player1 has enemy
            $("#my_message").val("");
            database.ref("players/"+my_key).update({ message:message });

            $("#dialogue").append("<p> You: "+message+"</p>");
            $("#my_message").focus();
        }
    })

    // when message div is click, remove #dialogue's red border color
    $("#message_div").on("click",function(){  
        event.preventDefault();     
        $('#dialogue').css("border", "");   
    })
})
