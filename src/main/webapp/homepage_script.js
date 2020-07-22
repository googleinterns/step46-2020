// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const MAPSKEY = config.MAPS_KEY
let userLocation = null;
let currentCategory = "all";

window.onscroll = function() {
    if (window.innerWidth >= 1204) {
        const navbar = document.getElementsByTagName("nav")[0];
        OFFSET = 180; // approx distance from top of page to top of control (categories) bar
        if (window.pageYOffset >= OFFSET || document.body.scrollTop >= OFFSET || document.documentElement.scrollTop >= OFFSET) {
            navbar.style.backgroundColor = "white";
        } else navbar.style.backgroundColor = "transparent";
    }
}

/* Calls addUIClickHandlers and getUserNeighborhood once page has loaded */
if (document.readyState === 'loading') {
    // adds on load event listeners if document hasn't yet loaded
    document.addEventListener('DOMContentLoaded', addUIClickHandlers);
    document.addEventListener('DOMContentLoaded', getUserNeighborhood);
} else {
    // if DOMContentLoaded has already fired, it simply calls the functions
    addUIClickHandlers();
    getUserNeighborhood();
}

/* Function adds all the necessary UI 'click' event listeners*/
function addUIClickHandlers() {
    // adds showCreateTaskModal and closeCreateTaskModal click events for the add task button
    if (document.body.contains(document.getElementById("addtaskbutton"))) {
        document.getElementById("addtaskbutton").addEventListener("click", showCreateTaskModal);
    	document.getElementById("close-addtask-button").addEventListener("click", closeCreateTaskModal);
    }

    // adds filterTasksBy click event listener to category buttons
    const categoryButtons = document.getElementsByClassName("categories");
    for (let i = 0; i < categoryButtons.length; i++) {
        categoryButtons[i].addEventListener("click", function(e) {
            filterTasksBy(e.target.id);
        });
    }
    // adds showTopScoresModal click event 
    document.getElementById("topscore-button").addEventListener("click", showTopScoresModal);
    document.getElementById("close-topscore-button").addEventListener("click", closeTopScoresModal);
    
    // adds closeTaskInfoModal click event
    document.getElementById("task-info-close-button").addEventListener("click", closeTaskInfoModal);
}

/* Function filters tasks by categories and styles selected categories */
function filterTasksBy(category) {
    currentCategory = category;

    // only fetches tasks if user's neighborhood has been retrieved
    if (userNeighborhoodIsKnown()) {
        fetchTasks(category)
            .then(response => displayTasks(response));
    }
	// Unhighlights and resets styling for all category buttons
    const categoryButtons = document.getElementsByClassName("categories");
    for (let i = 0; i < categoryButtons.length; i++){
        let button = categoryButtons[i];
        if (document.getElementById(category) != button) {
            button.style.backgroundColor = "rgb(76, 175, 80)";
        	button.addEventListener("mouseover", function() {
                button.style.backgroundColor = "rgb(62, 142, 65)";
            });
            button.addEventListener("mouseout", function() {
                button.style.backgroundColor = "rgb(76, 175, 80)"
            });
        } else {
            button.style.backgroundColor = "rgb(62, 142, 65)";
            button.addEventListener("mouseover", function() {
                button.style.backgroundColor = "rgb(62, 142, 65)";
            });
            button.addEventListener("mouseout", function() {
                button.style.backgroundColor = "rgb(62, 142, 65)"
            });
        }
    }
}

/* Function that display the help out overlay */
function helpOut(element) {
    const task = element.closest(".task");
    const overlay = task.getElementsByClassName("help-overlay");
    overlay[0].style.display = "block";
}

/* Function sends a fetch request to the edit task servlet when the user
offers to help out, edits the task's status and helper properties, and
then reloads the task list */
function confirmHelp(element) {
    const task = element.closest(".task");
    const url = "/tasks/edit?task-id=" + task.dataset.key + "&action=helpout";
    const request = new Request(url, {method: "POST"});
    fetch(request).then((response) => {
        // checks if another user has already claimed the task
        if (response.status == 409) {
            window.alert
                ("We're sorry, but the task you're trying to help with has already been claimed by another user.");
            window.location.href = '/';
        }
        // fetches tasks again if user's current neighborhood was successfully retrieved and stored
        else if (userNeighborhoodIsKnown()) {
            fetchTasks(currentCategory).then(response => displayTasks(response));
        }
    });
}

/* Function that hides the help out overlay */
function exitHelp(element) {
	element.closest(".help-overlay").style.display = "none";
}

/* Leonard's implementation of the Add Task modal */
function showCreateTaskModal() {
    var modal = document.getElementById("createTaskModalWrapper");
    modal.style.display = "block";
}

function closeCreateTaskModal() {
    var modal = document.getElementById("createTaskModalWrapper");
    modal.style.display = "none";
}

function validateTaskForm(id) {
    var result = true;
    var form = document.getElementById(id);
    var inputName = ["task-overview", "task-detail", "reward", "category"];
    for (var i = 0; i < inputName.length; i++) {
        var name = inputName[i];
        var inputField = form[name.concat("-input")].value.trim();
        if (inputField === "") {
            result = false;
            form[name.concat("-input")].classList.add("highlight");
        } else {
            form[name.concat("-input")].classList.remove("highlight");
        }
    }
    if (!result) {
        alert("All fields are required. Please fill out all fields with non-empty input.");
        return false;
    }
    return true;
}

/* Function that calls the loadTopScorers functions
   and then shows the top scores modal */
function showTopScoresModal() {
    loadTopScorers("world");
    if (userNeighborhoodIsKnown()){
      loadTopScorers("nearby");
    }
    document.getElementById("topScoresModalWrapper").style.display = "block";
}

/* Function closes the top scores modal */
function closeTopScoresModal() {
    document.getElementById("topScoresModalWrapper").style.display = "none";
}

/* Function loads the data for the top scorers table */
function loadTopScorers(location) {
    let url = "/account?action=topscorers";
    if (location === "nearby") {
      url += "&lat=" + userLocation.lat + "&lng=" + userLocation.lng;
    }
    fetch(url)
      .then(response => response.json())
      .then(users => {
        // Inserts Nickname and Points for every top scorer
        for (let i = 0; i < users.length; i++) {
          let points = users[i].points;
          let nickname = users[i].nickname;
          let rowId = location + (i + 1);
          let row = document.getElementById(rowId);
          let rowNickname = row.getElementsByClassName("topscore-nickname")[0];
          let rowScore = row.getElementsByClassName("topscore-score")[0];
          rowNickname.innerText = nickname;
          rowScore.innerText = points;
          // Adds different styling if row includes current user
          if (users[i].isCurrentUser) {
            row.style.fontWeight = "bold";
            row.setAttribute("title", "Congratulations, you made it to the Top Scorers Board!");
          }
        }
    });
}

// If the user clicks outside of the modals, closes the modals directly
window.onclick = function(event) {
    var createTaskModal = document.getElementById("createTaskModalWrapper");
    if (event.target == createTaskModal) {
        createTaskModal.style.display = "none";
    }
    var topScoresModal = document.getElementById("topScoresModalWrapper");
    if (event.target == topScoresModal) {
        topScoresModal.style.display = "none";
    }

    var infoModal = document.getElementById("taskInfoModalWrapper");
    if (event.target == infoModal) {
        infoModal.style.display = "none";
    }
}

/* Leonard's implementation of showing task details in a pop up window */
async function getTaskInfo(keyString) {
    const queryURL = "/tasks/info?key=" + keyString;
    const request = new Request(queryURL, {method: "GET"});
    const response = await fetch(request);
    const info = await response.json();
    return info;
}

async function showTaskInfo(element) {
    const task = element.closest(".task");
    const info = await getTaskInfo(task.dataset.key);
    var detailContainer = document.getElementById("task-detail-container");
    detailContainer.innerHTML = "";
    detailContainer.appendChild(document.createTextNode(info.detail));
    var modal = document.getElementById("taskInfoModalWrapper");
    modal.style.display = "block";
}

function closeTaskInfoModal() {
    var modal = document.getElementById("taskInfoModalWrapper");
    modal.style.display = "none";
}

/* Function dynamically adds Maps API and
begins the processes of retrieving the user's neighborhood*/
function getUserNeighborhood() {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =  "https://maps.googleapis.com/maps/api/js?key=" + MAPSKEY + "&callback=initialize&language=en";
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
	
    // Once the Maps API script has dynamically loaded it gets the user location,
    // waits until it gets an answer and then calls toNeighborhood passing the location
    // as an argument, updates the global neighborhood variable and then calls
    // fetchTasks and displayTasks
	window.initialize = function () {
        getUserLocation().then(() => fetchTasks())
            .then((response) => displayTasks(response))
            .catch(() => {
                console.error("User location and/or neighborhood could not be retrieved");
                document.getElementById("location-missing-message").style.display = "block";
            });
	}
}

/* Function that returns a promise to get and return the user's location */
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                userLocation = {lat: position.coords.latitude, lng: position.coords.longitude};
                resolve(userLocation);
            }, function() {
                if (locationByIPSuccesful()) resolve(userLocation);
                else reject("User location failed");
            });
        } else {
            if (locationByIPSuccesful()) resolve(userLocation);
            else reject("User location failed");
        }
    });
}

function locationByIPSuccesful() {
    let url = "https://www.googleapis.com/geolocation/v1/geolocate?key=" + MAPSKEY;
    const request = new Request(url, {method: "POST"});
    fetch(request).then(response => {
        if (response.status == 400 || response.status == 403 || response.status == 404) {
            return false;
        } else {
            response.json().then(jsonresponse => {
                userLocation = jsonresponse["location"];
                return true;
            });
        }
    });
}

/* Fetches tasks from servlet by neighborhood and category */
function fetchTasks(category) {
    let url = "/tasks?lat=" + userLocation.lat + "&lng=" + userLocation.lng;
    if (category !== undefined && category != "all") {
        url += "&category=" + category;
    }
    return fetch(url);
}

/* Displays the tasks received from the server response */
function displayTasks(response) {
    response.json().then(html => {
        if (html){
            document.getElementById("no-tasks-message").style.display = "none";
            document.getElementById("tasks-message").style.display = "block";
            document.getElementById("tasks-list").innerHTML = html;
            document.getElementById("tasks-list").style.display = "block";
            addTasksClickHandlers();
        } else {
            document.getElementById("no-tasks-message").style.display = "block";
            document.getElementById("tasks-message").style.display = "none";
            document.getElementById("tasks-list").style.display = "none";
        }
    });
}

/* Function adds all the necessary tasks 'click' event listeners*/
function addTasksClickHandlers() {

    // adds confirmHelp click event listener to confirm help buttons
    const confirmHelpButtons = document.getElementsByClassName("confirm-help");
    for (let i = 0; i < confirmHelpButtons.length; i++){
        confirmHelpButtons[i].addEventListener("click", function(e) {
            confirmHelp(e.target);
            e.stopPropagation();
        });
        
    }
    // adds exitHelp click event listener to exit help buttons
    const exitHelpButtons = document.getElementsByClassName("exit-help");
    for (let i = 0; i < exitHelpButtons.length; i++) {
        exitHelpButtons[i].addEventListener("click", function(e) {
            exitHelp(e.target);
            e.stopPropagation();
        });
    }

    // adds helpOut click event listener to help out buttons
    const helpOutButtons = document.getElementsByClassName("help-out");
    for (let i = 0; i < helpOutButtons.length; i++) {
        if (!helpOutButtons[i].classList.contains("disable-help")) {
            helpOutButtons[i].addEventListener("click", function(e) {
                helpOut(e.target);
                e.stopPropagation();
            });
        }
    }

    // adds stopPropagation on help overlay to prevent opening task details when clicking on it
    const helpOverlays = document.getElementsByClassName("help-overlay");
    for (let i = 0; i < helpOverlays.length; i++) {
        helpOverlays[i].addEventListener("click", function(e) {
            e.stopPropagation();
        });
    }
    
    // adds task click event listener to open up task details
    const tasks = document.getElementsByClassName("task");
    for (let i = 0; i < tasks.length; i++) {
        tasks[i].addEventListener("click", function(e) {
            showTaskInfo(e.target);
        });
    }
}

/* Helper function that determines if the current user's neighborhood is known */
function userNeighborhoodIsKnown() {
  return (userLocation !== null);
}
