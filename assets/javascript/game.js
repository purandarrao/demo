
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

var my_name = "";
var my_win = 0;
var my_lose = 0;
var my_choice = "";
var enemy = "";
var enemy_choice = "";
var my_enemy_key = null;
var my_ref = null;

function printChoice(id){
    $(id).empty()
    $(id).append("<button class='list-group-item my_choice'>Rock</button>");
    $(id).append("<button class='list-group-item my_choice'>Paper</button>");
    $(id).append("<button class='list-group-item my_choice'>Scissors</button>");

}

function printResult(id,wins,loses){
    $(id).empty();
    $(id).text("Wins: " + wins + "  Loses: "+ loses);
}

$("document").ready(function(){

    // handle startBnt click
    $("#startBnt").on("click",function(){
        // console.log("hello");
        var name = $("#player_name").val().trim();
        if(my_name === "" && name !== ""){ // if no player exists and name input is not empty
        
            player_ref.orderByChild("name").equalTo(name).once("value",function(snapshot){
                if(! snapshot.val()){ // if user name is not existing                   
                    my_name = name;
                    var wait_time = Number.MIN_VALUE;

                    // find enemy who waits for the longest
                    player_ref.orderByChild("waitTime").limitToLast(1).once("value",function(snapshot){
                        var data = snapshot.val();
                        // console.log(data);
                        if(data !== null){ // if there is someone waiting to play game
                            var key = Object.keys(data)[0];
                            if(data[key].enemy === ""){  // if the returned player isn't playing with someone
                                console.log("enemy = "+data[key].name);
                                my_enemy_key = key;
                                console.log("my_enemy_key = "+my_enemy_key);
                                enemy = data[my_enemy_key].name;

                                // set myself as the enemy of the returned player and waitTime to max integer 
                                database.ref("players/"+my_enemy_key).update({enemy: my_name});
                                database.ref("players/"+my_enemy_key).update({waitTime: Number.MIN_VALUE});                               
                            }
                        } 
                    
                        // set waitTime to current time if we find a player
                        if(enemy === ""){
                            wait_time = moment().format("X");
                        }

                        // save my info into database
                        var play_info = { 
                                            name: my_name,
                                            wins: my_win,
                                            loses: my_lose,
                                            enemy: enemy,
                                            waitTime: wait_time,
                                            choice: ""
                                        }
                        my_ref = player_ref.push(play_info).getKey();
                        // console.log("my_ref = "+my_ref);

                        // clear the start input
                        $("#player_name").val("");

                        // check if we have update in enemy property
                        database.ref("players/"+my_ref+"/enemy").on("value",function(snapshot){
                            // render player2's choice and score
                            var data = snapshot.val();
                            // console.log("player2="+data);
                            if(data !== ""){
                                player_ref.orderByChild("name").equalTo(data).once("value",function(snap){
                                    var key = Object.keys(snap.val())[0];
                                    var enemy_data = snap.val()[key];
                                    
                                    // console.log("player2 fire");
                                    // console.log(enemy_data);
                                    if(enemy_data !== null){
                                        enemy = enemy_data.name;
                                        $("#player2_name").text(enemy);
                                        printChoice("#player2_choice");
                                        printResult("#player2_result",enemy_data.wins,enemy_data.loses);
                                        
                                        database.ref("players/"+key+"/choice").on("value",function(snapshot){
                                            enemy_choice = snapshot.val()
                                            if(my_choice !== ""){
                                                console.log("enemy guess");
                                                console.log("enemy_choice="+enemy_choice);
                                                console.log("my_choice="+my_choice);
                                                $("#game_result").empty();
                                                if(my_choice === "Rock" && enemy_choice == "Paper"){
                                                    $("#game_result").append("<h5>"+enemy+" won!</h5>")
                                                }else if(my_choice === "Paper" && enemy_choice == "Scissors"){
                                                    $("#game_result").append("<h5>"+enemy+" won!</h5>")
                                                }else if(my_choice === "Scissors" && enemy_choice == "Rock"){
                                                    $("#game_result").append("<h5>"+enemy+" won!</h5>")
                                                }else if(my_choice === enemy_choice){
                                                    $("#game_result").append("<h5>No one won!</h5>");
                                                }else{
                                                    $("#game_result").append("<h5>"+my_name+" won!</h5>")
                                                }
                                                enemy_choice = "";
                                                my_choice = "";
                                                database.ref("players/"+my_ref).update({choice:""});
                                            }
                                        })
                                    }


                                })
                            }
                            
                        })
                    
                        database.ref("players/"+my_ref).on("value",function(snapshot){
                            // console.log("players/"+my_ref);
                            // render player1's choice and score
                            var data = snapshot.val()
                            // console.log("player1 fire");
                            // console.log("player1="+data)
                            if(data !== null){
                                $("#player1_name").text(data.name);
                                printChoice("#player1_choice");
                                printResult("#player1_result",data.wins,data.loses);
                            }
                        })

                        database.ref("players/"+my_ref+"/choice").on("value",function(snapshot){
                            my_choice = snapshot.val();
                            if(enemy_choice !== ""){
                                console.log("my_guess")
                                console.log("enemy_choice="+enemy_choice);
                                console.log("my_choice="+my_choice);
                                // my_choice = snapshot.val()
                                if(my_choice === "Rock" && enemy_choice === "Paper"){
                                    $("#game_result").append("<h5>"+enemy+" won!</h5>");
                                }else if(my_choice === "Paper" && enemy_choice === "Scissors"){
                                    $("#game_result").append("<h5>"+enemy+" won!</h5>");
                                }else if(my_choice === "Scissors" && enemy_choice === "Rock"){
                                    $("#game_result").append("<h5>"+enemy+" won!</h5>");
                                }else if(my_choice === enemy_choice){                             
                                    $("#game_result").append("<h5>No one won!</h5>");
                                }else{
                                    
                                    $("#game_result").append("<h5>"+my_name+" won!</h5>");
                                }
                                enemy_choice = "";
                                my_choice = "";
                                database.ref("players/"+my_ref).update({choice:""});
                            }
                        })
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
            $(this).attr("style","color:#4CAF50");
            database.ref("players/"+my_ref).update({choice:my_choice});
        }
    })



})

