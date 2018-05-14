

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

var myname = "";
var mywin = 0;
var mylose = 0;

function printChoice(id){
    console.log("hello");
    $(id).append("<button class='list-group-item'>Rock</button>");
    $(id).append("<button class='list-group-item'>Paper</button>");
    $(id).append("<button class='list-group-item'>Scissors</button>");
}

$("document").ready(function(){

    // handle startBnt click
    $("#startBnt").on("click",function(){
        // console.log("hello");
        myname = $("#player_name").val().trim();
        $("#player1_name").text(myname);
        printChoice("#player1_choice");
    })


})

