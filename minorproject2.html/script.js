'use strict';



/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}



/**
 * navbar toggle
 */

const navbar = document.querySelector("[data-navbar");
const navToggler = document.querySelector("[data-nav-toggler]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
  document.body.classList.toggle("active");
}

addEventOnElem(navToggler, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
  document.body.classList.remove("active");
}

addEventOnElem(navbarLinks, "click", closeNavbar);



/**
 * active header & back top btn when window scroll down to 100px
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElemOnScroll = function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
}

addEventOnElem(window, "scroll", activeElemOnScroll);
function checkSymptoms() {
    let symptoms = document.querySelectorAll('input[name="symptom"]:checked');
    let symptomList = Array.from(symptoms).map(symptom => symptom.value);

    let resultText = "";

    if (symptomList.length === 0) {
        resultText = "You have not selected any symptoms. If you feel unwell, consult a doctor.";
    } else if (symptomList.includes("fever") && symptomList.includes("cough") && symptomList.includes("shortness_of_breath")) {
        resultText = "You have multiple key symptoms of HMPV. Please consult a doctor immediately.";
    } else if (symptomList.includes("sore_throat") || symptomList.includes("fatigue") || symptomList.includes("runny_nose")) {
        resultText = "You have mild symptoms. Monitor your condition and consult a doctor if symptoms worsen.";
    } else {
        resultText = "Your symptoms are not strongly indicative of HMPV. However, if you feel unwell, seek medical advice.";
    }

    document.getElementById("result").innerHTML = resultText;
}
function resetForm() {
    let checkboxes = document.querySelectorAll('input[name="symptom"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    // Clear the result text
    document.getElementById("result").innerHTML = "";
}

/* talk to us*/
