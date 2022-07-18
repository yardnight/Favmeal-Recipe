const mealsEl = document.getElementById("meals");
const favoriteContainer = document.getElementById("fav-meals");

const mealPopup = document.getElementById("meal-popup");
const mealInfoEl = document.getElementById("meal-info");
const popupCloseBtn = document.getElementById("close-popup");

const searchTerm = document.getElementById("search-term");
const searchBtn = document.getElementById("search");

getRandomMeal();
fetchFavMeals();

async function getRandomMeal() {
    const resp = await fetch(
        "https://www.themealdb.com/api/json/v1/1/random.php"
    );
    const respData = await resp.json();
    const randomMeal = respData.meals[0];

    //// console.log(randomMeal);

    addMeal(randomMeal, true);
}

async function getMealById(id) {
    const resp = await fetch(
        "https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + id
    );

    const respData = await resp.json();
    const meal = respData.meals[0];

    return meal;
}
async function getMealBySearch(term) {
    if (term === "") {
        searchTerm.value = "choosen non";
        setTimeout(reloadPage, 1000);
        function reloadPage() {
            location.reload();
        }
    } else {
        const resp = await fetch(
            "https://www.themealdb.com/api/json/v1/1/search.php?s=" + term
        );

        const respData = await resp.json();
        const meals = respData.meals;

        return meals;
    }
}

function addMeal(mealData, random = false) {
    // console.log(mealData);
    const meal = document.createElement("div");
    meal.classList.add("meal");

    meal.innerHTML = `
    <div class="meal-header">
        ${
            random
                ? `<span class="random" id ="random">Random Recipe</span>`
                : `<span class="random hidden" id ="random">Random Recipe</span>`
        }
        <img 
            src="${mealData.strMealThumb}" 
            alt="${mealData.strMeal}"
        />                        
    </div>
    <div class="meal-body">
        <h4>${mealData.strMeal}</h4>
        <button class = "fav-btn">
            <i class="fas fa-heart"></i>
        </button>
    </div>
    `;

    const btn = meal.querySelector(".meal-body .fav-btn");
    const mealHeader = meal.querySelector(".meal-header");

    btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) {
            removeMealLS(mealData.idMeal);
            btn.classList.remove("active");
        } else {
            addMealLS(mealData.idMeal);
            btn.classList.add("active");
        }

        fetchFavMeals();
    });
    //=================<reload when click>==============================
    const randomBtn = meal.querySelector(".random");
    //// console.log("randomBTN", randomBtn);
    randomBtn.addEventListener("click", () => {
        location.reload();
    });

    // show info by double-click
    mealHeader.addEventListener("dblclick", () => {
        showMealInfo(mealData);
    });
    // show info by double-touch
    mealHeader.addEventListener("touchstart", tapHandler, { passive: true });
    var tapedTwice = false;

    function tapHandler(event) {
        if (!tapedTwice) {
            tapedTwice = true;
            setTimeout(function () {
                tapedTwice = false;
            }, 300);
            return false;
        }
        event.preventDefault();
        //action on double tap goes below
        showMealInfo(mealData);
    }

    mealsEl.appendChild(meal);
}

function addMealLS(mealId) {
    const mealIds = getMealsLS();

    localStorage.setItem("mealIds", JSON.stringify([...mealIds, mealId]));
}

function removeMealLS(mealId) {
    const mealIds = getMealsLS();

    localStorage.setItem(
        "mealIds",
        JSON.stringify(mealIds.filter((id) => id !== mealId))
    );
}

function getMealsLS() {
    const mealIds = JSON.parse(localStorage.getItem("mealIds"));

    return mealIds === null ? [] : mealIds;
}

async function fetchFavMeals() {
    // clean the container
    favoriteContainer.innerHTML = "";

    const mealIds = getMealsLS();

    for (let i = 0; i < mealIds.length; i++) {
        const mealId = mealIds[i];
        let fetchedMeal = await getMealById(mealId);

        addMealFav(fetchedMeal);
    }
}

function addMealFav(mealData) {
    const favMeal = document.createElement("li");
    favMeal.innerHTML = `
    <img 
        class="img"
        src="${mealData.strMealThumb}" 
        alt="${mealData.strMeal}">
    <span>${mealData.strMeal}</span>
    <button class = "clear"><i class="fa-solid fa-xmark"></i></button>
    `;

    const btn = favMeal.querySelector(".clear");
    const img = favMeal.querySelector(".img");
    btn.addEventListener("click", () => {
        removeMealLS(mealData.idMeal);

        fetchFavMeals();
    });

    img.addEventListener("click", () => {
        showMealInfo(mealData);
    });

    favoriteContainer.appendChild(favMeal);
}

searchBtn.addEventListener("click", async () => {
    // clean container
    mealsEl.innerHTML = "";
    const search = searchTerm.value;

    const meals = await getMealBySearch(search);
    if (meals) {
        meals.forEach((meal) => {
            addMeal(meal);
        });
    }
});

function showMealInfo(mealData) {
    // clean it up
    mealInfoEl.innerHTML = "";
    // update the Meal info
    const mealEl = document.createElement("div");
    // get ingredients and mesures
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        if (mealData["strIngredient" + i]) {
            ingredients.push(
                `${mealData["strIngredient" + i]} 
                - ${mealData["strMeasure" + i]}
                `
            );
        } else {
            break;
        }
    }

    mealEl.innerHTML = `
        <h2>${mealData.strMeal}</h2>
        <img 
            src="${mealData.strMealThumb}" 
            alt="${mealData.strMeal}">
        <h3>Ingredients:</h3>
        <ul>
            ${ingredients
                .map(
                    (ing) => `
            <li>${ing}</li>
            `
                )
                .join("")}
        </ul> 
        <p>${mealData.strInstructions}</p>
    `;
    mealInfoEl.appendChild(mealEl);
    // show the popup
    mealPopup.classList.remove("hidden");
    // const bodyLock = document.getElementsByTagName("body");
    //// console.log("Body:", bodyLock);
    document.body.classList.add("_lock");
}

popupCloseBtn.addEventListener("click", () => {
    mealPopup.classList.add("hidden");
    document.body.classList.remove("_lock");
});

//===============<swipe reload code>==================

mealsEl.addEventListener("touchstart", fingerTouch, { passive: true });
mealsEl.addEventListener("touchmove", fingerSwipe, { passive: true });

let xOfTouch = null;

let yOfTouch = null;

function fingerTouch(event) {
    //// console.log("event:", event);
    const screenTouch = event.touches[0];

    xOfTouch = screenTouch.clientX;
    yOfTouch = screenTouch.clientY;
}

function fingerSwipe(event) {
    if (!xOfTouch || !yOfTouch) {
        return false;
    }
    let xOfSwipe = event.touches[0].clientX;
    let yOfSwipe = event.touches[0].clientY;
    let xDiff = xOfTouch - xOfSwipe;
    let yDiff = yOfTouch - yOfSwipe;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        // r-l
        if (xDiff > 0) {
            console.log("right");
            if (Math.abs(xDiff) > 100) {
                location.reload();
            }
        } else {
            console.log("left");
        }
    } else {
        // t-b
        if (yDiff > 0) {
            console.log("top");
        } else {
            if (Math.abs(yDiff) > 200) {
                location.reload();
            }
            console.log("bottom");
        }
    }
}
