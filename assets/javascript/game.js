
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

function printChoice(id){
    $(id).empty()
    $(id).append("<button class='list-group-item my_choice'>Rock</button>");
    $(id).append("<button class='list-group-item my_choice'>Paper</button>");
    $(id).append("<button class='list-group-item my_choice'>Scissors</button>");

}

function printResult(id){
    $(id).empty();
    $(id).text("Wins: " + my_win + "    Loses: "+ my_lose + "   Tie: " + my_tie );
}

function checkWhoWin(){
    $("#player1_choice .my_choice").css("background-color", "lightblue");
    $("#game_result").empty();
    $("#game_result").append("<h6>Your choice: "+my_choice+"</h>")
    $("#game_result").append("<h6>"+enemy +"'s choice: "+enemy_choice+"</h>")
    
    // compare choices
    var r1 = my_choice === "Rock" && enemy_choice == "Paper";
    var r2 = my_choice === "Paper" && enemy_choice == "Scissors";
    var r3 = my_choice === "Scissors" && enemy_choice == "Rock";
    var r4 = my_choice === enemy_choice;

    if(r1 | r2 | r3){
        $("#game_result").append("<h5>"+enemy+" won!</h5>")
        my_lose += 1;
    }else if(r4){
        $("#game_result").append("<h5>No one won!</h5>");
        my_tie += 1;
    }else{
        $("#game_result").append("<h5>"+my_name+" won!</h5>")
        my_win += 1;
    }

    printResult("#player1_result");
    // clean up
    enemy_choice = "";
    my_choice = "";
    database.ref("players/"+my_key).update({choice:""});
}

$("document").ready(function(){
    wait_time = moment().format("X");

    // handle startBnt click
    $("#startBnt").on("click",function(){
        var name = $("#player_name").val().trim();
        if( !in_game && name !== ""){ // if we are not in a middle of a game and name input is not empty
        
            player_ref.orderByChild("name").equalTo(name).once("value",function(snapshot){
                if(! snapshot.val()){ // if user name is not existing                   
                    my_name = name;

                    // find player who waits for the longest
                    player_ref.orderByChild("waitTime").limitToLast(1).once("value",function(snapshot){
                        var data = snapshot.val();
                        
                        if(data !== null){ // if there is someone waiting to play game
                            var key = Object.keys(data)[0];
                            if(data[key].enemy === ""){  // if the returned player isn't playing with someone
                                my_enemy_key = key;
                                enemy = data[my_enemy_key].name;
                                wait_time = Number.MIN_VALUE;

                                // set myself as the enemy of the returned player and waitTime to min integer 
                                database.ref("players/"+my_enemy_key).update({enemy: my_name, waitTime: wait_time});                                 

                                // handle enemy offline event
                                database.ref("players/"+my_enemy_key).on('value', function(snapshot) {
                                    console.log("snapshot.val()="+snapshot.val())
                                    
                                    if (snapshot.val() === null && enemy !== "") {
                                        // console.log(snapshot.val())
                                        database.ref("players/"+my_enemy_key).remove();
                                        $("#player2_name").text(enemy + " has left the game!");
                                        $("#player2_choice").empty();
                                        $("#player2_result").empty();
                                        database.ref("players/"+my_key).update({enemy:"",waitTime:moment().format("X")});
                                    }
                                });
                            }
                        } 
                
                        // save my info into database
                        var player_info = { 
                            name: my_name,
                            enemy: enemy,
                            waitTime: wait_time,
                            choice: "",
                            online: true,
                        }
                        database.ref("players/"+my_key).update(player_info);

                        // clear the start input
                        $("#player_name").val("");

                        // check if we have update in enemy property
                        database.ref("players/"+my_key+"/enemy").on("value",function(snapshot){
                            var data = snapshot.val();
                            if(data !== ""){
                                player_ref.orderByChild("name").equalTo(data).once("value",function(snap){
                                    my_enemy_key = Object.keys(snap.val())[0];
                                    var enemy_data = snap.val()[my_enemy_key];
                                    
                                    if(enemy_data !== null){
                                        // render player2's choice and score
                                        enemy = enemy_data.name;
                                        $("#player2_name").text(enemy);
                                        printChoice("#player2_choice");
                                        printResult("#player2_result");
                                        
                                        database.ref("players/"+my_enemy_key+"/choice").on("value",function(snapshot){
                                            enemy_choice = snapshot.val()
                                            if(my_choice !== ""){
                                                checkWhoWin();
                                            }
                                        })

                                        // handle enemy offline event
                                        database.ref("players/"+my_enemy_key).on('value', function(snapshot) {
                                            console.log("snapshot.val()="+snapshot.val())
                                            
                                            if (snapshot.val() === null && enemy !== "") {
                                                $("#player2_name").text(enemy + " has left the game!");
                                                $("#player2_choice").empty();
                                                $("#player2_result").empty();
                                                database.ref("players/"+my_key).update({enemy:"",waitTime:moment().format("X")});
                                            }
                                        });
                                    }
                                })
                            }
                            
                        })
                    
                        
                        // check database and render player1's choice and score
                        database.ref("players/"+my_key).on("value",function(snapshot){
                            var data = snapshot.val()
                            if(data !== null){
                                if(!in_game){
                                    $("#player1_name").text(data.name);
                                    printChoice("#player1_choice");
                                    printResult("#player1_result");
                                }
                                in_game = true;
                            }
                        })

                        database.ref("players/"+my_key+"/choice").on("value",function(snapshot){
                            my_choice = snapshot.val();
                            if(enemy_choice !== ""){
                                checkWhoWin();
                            }
                        })

                        // handle enemy offline event
                        database.ref("players/"+my_key+"/online").on('value', function(snapshot) {
                            if (snapshot.val()) {
                                database.ref("players/"+my_key).onDisconnect().remove();
                            }
                        });

                    })              
                }else{  // if player name is already existed
                    alert("This user name has been used by other player!")
                }       
            })              
        }
    })

    $("#player1_choice").on("click",".my_choice",function(){
        if(my_choice === "" && enemy !== ""){
            my_choice = $(this).text();
            $(this).css('background-color','red')
            $("#game_result").empty();
            database.ref("players/"+my_key).update({choice:my_choice});
        }
    })

})

