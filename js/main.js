const LOCAL_STORAGE_RECIPE_KEY = 'recipes.recipes';

let ingredientLines = [];
let nutrients = {};
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const query = urlParams.get('q').toLowerCase();
const resultIndex = urlParams.get('i') || 0;

let recipesArray = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECIPE_KEY)) || [];
let recipes = {};
let Recipe;

const recipeDetailsNavigation = document.querySelector('.recipe-details__navigation');
const recipeDetailsContainer = document.getElementById('variable-content');
const navigationElements = document.querySelectorAll('.navigation__element');
const servingsSpan = document.getElementById('servings-value');
let servingText = 'servings';
const caloriesSpan = document.getElementById('calories-value');
const totalTimeSpan = document.getElementById('total-time-value');
const dishTypeSpan = document.getElementById('dish-type');
const recipeTitleSpan = document.getElementById('recipe-title');
const mealTypeSpan = document.getElementById('meal-type');
const recipeImage = document.getElementById('recipe-image');
const defaulListType = 'recipe-ingredients-template';
const searchInputElement = document.getElementById('search-input');
const searchSkeletonTemplate = document.importNode(document.getElementById('search-skeleton-element').content, true);
const searchResultsElement = document.getElementById('search-results');
const searchResultsList = document.getElementById('search-results-list');
const searchResultTemplate = document.importNode(document.getElementById('search-result-element').content, true);
const searchFormElement = document.getElementById('search-form');
let searchResult = [];
let searchQuery;

const apiUrl= 'https://edamam-recipe-search.p.rapidapi.com/search';
const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Host': 'edamam-recipe-search.p.rapidapi.com',
        'X-RapidAPI-Key': '011c647cf0msh349d44b30e57cdep13bcb5jsn26aa5f532a29'
    }
};

function save() {
    localStorage.setItem(LOCAL_STORAGE_RECIPE_KEY, JSON.stringify(recipesArray));
}

function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
}

function renderRecipeDetails(type) {
    if(recipeDetailsContainer.firstChild) {
        clearElement(recipeDetailsContainer);
    }
    const recipeDetailsContent = document.importNode(document.getElementById(type).content, true);

    if(type === 'recipe-ingredients-template') {
        const ingredientList = recipeDetailsContent.querySelector('.ingredients__list');
        ingredientLines = Recipe.ingredientLines;
        ingredientLines.forEach( (ingredient, index) => {
            const ingredientElement = document.importNode(document.getElementById('recipe-ingredient-template').content, true);
            const ingredientCheckbox = ingredientElement.querySelector('.ingredient__checkbox');
            const ingredientLabel = ingredientElement.querySelector('.ingredient__label');
            ingredientCheckbox.id = `ingredient-${index + 1}`;
            ingredientLabel.htmlFor = ingredientCheckbox.id;
            ingredientLabel.innerText = ingredient;
            ingredientList.appendChild(ingredientElement);
        })
        recipeDetailsContainer.appendChild(recipeDetailsContent);
    }

    else if (type === 'recipe-nutrients-template') {
        const nutrientList = recipeDetailsContent.querySelector('.nutrients__list');
        nutrients = Recipe.totalNutrients;
        Object.entries(nutrients).forEach(([, { label, quantity, unit } ]) => {
            if(quantity > 0.1 && label !== 'Energy' && unit !== 'µg') {
                const nutrientElement = document.importNode(document.getElementById('recipe-nutrient-template').content, true);
                const nutrientLabel = nutrientElement.querySelector('.nutrient__label');
                const nutrientValue = nutrientElement.querySelector('.nutrient__value');
                nutrientLabel.innerText = label;
                nutrientValue.innerText = `${quantity.toFixed(1)} ${unit}`;
                nutrientList.appendChild(nutrientElement);
            }
        recipeDetailsContainer.appendChild(recipeDetailsContent);
        })
    }
}

function removeActiveClass(clickedElement) {
    navigationElements.forEach(element => {
        if(element !== clickedElement) {
            element.classList.remove('navigation__element--active');
        }
    })
}

function addActiveClass(element) {
    if(!element.classList.contains('navigation__element--active')) {
        element.classList.add('navigation__element--active');
    }
}

function renderRecipeParameters() {
    if(Recipe.yield === 1) { servingText = 'serving'};
    servingsSpan.innerText = `${Recipe.yield} ${servingText}`;
    caloriesSpan.innerText = `${Recipe.calories.toFixed(0)} calories`;
    totalTimeSpan.innerText = `${Recipe.totalTime} minutes`;
}

function renderRecipeHeader() {
    dishTypeSpan.innerText = Recipe.dishType;
    recipeTitleSpan.innerText = Recipe.label;
    mealTypeSpan.innerText = Recipe.mealType;
    recipeImage.src = Recipe.image;
}

function renderAll() {
    renderRecipeHeader();
    renderRecipeParameters();
    renderRecipeDetails(defaulListType); //Load default ListType
}

function addNavigationListener() {
    recipeDetailsNavigation.addEventListener('click', e => {
    const navigationElement = e.target.closest('.navigation__element')
    if(e.target.classList.contains('navigation__element') || Boolean(navigationElement)) {
        const type = `${navigationElement.id}-template`;
        removeActiveClass(navigationElement);
        addActiveClass(navigationElement);
        renderRecipeDetails(type);
    }
})
}

function showMessage(message = 'Recipe not found') {
    const messageBox = document.createElement('span');
    messageBox.className = 'search-message';
    messageBox.innerText = message;
    clearElement(searchResultsList);
    searchResultsList.appendChild(messageBox);
}

function getLocalSearchResult(userInput) {
    searchQuery = userInput.toLowerCase().trim();
    searchResult = [];
    if(recipesArray) {
        recipesArray.forEach(element => {
            if(element.q === searchQuery) {
                searchResult = element.hits;
            }
        })
    }
}

function renderSkeletonSearchResult() {
    clearElement(searchResultsList);
    for (let i = 0; i < 10; i++) {
        const skeletonElement = searchSkeletonTemplate.cloneNode(true).firstElementChild;
        searchResultsList.appendChild(skeletonElement);
    }
}

async function getExternalSearchResult(userInput) {
    if(userInput && userInput.trim() !== '') {
        renderSkeletonSearchResult();
        try {
            const response = await fetch(`${apiUrl}?q=${userInput}`, options);
            const responseObject = await response.json();
            if(responseObject.hits.length > 0) {
                recipesArray.push(responseObject);
                save();
                renderSearchResult(responseObject.hits);
            } else {
                showMessage();
            }
        } catch (error) {
            console.log(error);
        }
    } else {showMessage(`input can't be empty`)};
}

function renderSearchResult(searchResult) {
    clearElement(searchResultsList);
    searchResult.forEach((element, index) => {
        const result = searchResultTemplate.cloneNode(true);
        const resultLink = result.querySelector('.search-result');
        resultLink.href = `recipe.html?q=${searchQuery}&i=${index}`;
        const resultImg = result.querySelector('.search-result__image');
        resultImg.src = element.recipe.image;
        resultImg.alt = element.recipe.label;
        const resultTitle = result.querySelector('.search-result__title');
        resultTitle.innerText = element.recipe.label;
        const resultDishType = result.querySelector('.search-result__dish-type');
        resultDishType.innerText = element.recipe.dishType;
        const resultServings = result.querySelector('.search-result__servings');
        if(element.yield === 1) { servingText = 'serving'};
        resultServings.innerText = `${element.recipe.yield} ${servingText}`;
        searchResultsList.appendChild(result);
    })
}

function registerEventListeners() {
    searchInputElement.addEventListener('focusin', () => {
        searchResultsElement.classList.add('nav-bar__search-results--active');
        searchResultsElement.classList.remove('nav-bar__search-results--inactive');
    })

    document.addEventListener('click', (e) => {
        if(!e.target.closest('.nav-bar__search-results--active') && !e.target.classList.contains('nav-bar__search-input')) {
            searchResultsElement.classList.add('nav-bar__search-results--inactive');
        }
    })

    searchResultsElement.addEventListener('animationend', e => {
        if(e.target.classList.contains('nav-bar__search-results--inactive')) {
            searchResultsElement.classList.remove('nav-bar__search-results--active');
        }
    })

    searchInputElement.addEventListener('input', () => {
        clearElement(searchResultsList);
        getLocalSearchResult(searchInputElement.value)
        if(searchResult.length) {
            renderSearchResult(searchResult)};
    });

    searchFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        getExternalSearchResult(searchInputElement.value);
    })
}

registerEventListeners();

if(recipesArray) {
    recipesArray.forEach(element => {
        if(element.q === query) {
            recipes = element;
        }
    })
}

if(Object.keys(recipes).length === 0 && Object.getPrototypeOf(recipes) === Object.prototype) {
    if(query) {
        fetch(`${apiUrl}?q=${query}`, options)
            .then(response => response.json())
            .then(response => {
                recipes = response;
                if(recipes.hits.length > 0) {
                    recipesArray.push(recipes);
                    save();
                    Recipe = recipes.hits[resultIndex].recipe;
                    renderAll();
                    addNavigationListener()
                } else {
                    console.log('No recipe found')
                }
            })
            .catch(err => console.error(err));
    }
} else {
    if(recipes.hits.length > 0) {
        Recipe = recipes.hits[resultIndex].recipe;
        renderAll();
        addNavigationListener()
    } else {
        console.log('Recipe not found');
    }
}
