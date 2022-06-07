const LOCAL_STORAGE_RECIPE_KEY = 'recipes.recipes';

let ingredientLines = [];
let nutrients = {};
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const query = urlParams.get('q');

let recipesArray = JSON.parse(localStorage.getItem(LOCAL_STORAGE_RECIPE_KEY)) || [];
let recipes = {};
let firstRecipe;

const recipeDetailsNavigation = document.querySelector('.recipe-details__navigation');
const recipeDetailsContainer = document.getElementById('variable-content');
const navigationElements = document.querySelectorAll('.navigation__element');
const servingsSpan = document.getElementById('servings-value');
const caloriesSpan = document.getElementById('calories-value');
const totalTimeSpan = document.getElementById('total-time-value');
const dishTypeSpan = document.getElementById('dish-type');
const recipeTitleSpan = document.getElementById('recipe-title');
const mealTypeSpan = document.getElementById('meal-type');
const recipeImage = document.getElementById('recipe-image');
const defaulListType = 'recipe-ingredients-template';

const options = {
    method: 'GET',
    headers: {
        'X-RapidAPI-Host': 'edamam-recipe-search.p.rapidapi.com',
        'X-RapidAPI-Key': '011c647cf0msh349d44b30e57cdep13bcb5jsn26aa5f532a29'
    }
};

if(recipesArray) {
    recipesArray.forEach(element => {
        if(element.q === query) {
            recipes = element;
        }
    })
}

if(Object.keys(recipes).length === 0 && Object.getPrototypeOf(recipes) === Object.prototype) {
    if(query) {
        fetch(`https://edamam-recipe-search.p.rapidapi.com/search?q=${query}`, options)
            .then(response => response.json())
            .then(response => {
                recipes = response;
                recipesArray.push(recipes);
                save();
                firstRecipe = recipes.hits[0].recipe;
                renderAll();
            })
            .catch(err => console.error(err));
    }
    } else {
        firstRecipe = recipes.hits[0].recipe;
        renderAll();
    }

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
        ingredientLines = firstRecipe.ingredientLines;
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
        nutrients = firstRecipe.totalNutrients;
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
    let servingText = 'servings';
    if(firstRecipe.yield === 1) { servingText = 'serving'};
    servingsSpan.innerText = `${firstRecipe.yield} ${servingText}`;
    caloriesSpan.innerText = `${firstRecipe.calories.toFixed(0)} calories`;
    totalTimeSpan.innerText = `${firstRecipe.totalTime} minutes`;
}

function renderRecipeHeader() {
    dishTypeSpan.innerText = firstRecipe.dishType;
    recipeTitleSpan.innerText = firstRecipe.label;
    mealTypeSpan.innerText = firstRecipe.mealType;
    recipeImage.src = firstRecipe.image;
}

function renderAll() {
    renderRecipeHeader();
    renderRecipeParameters();
    renderRecipeDetails(defaulListType); //Load default ListType
}

recipeDetailsNavigation.addEventListener('click', e => {
    const navigationElement = e.target.closest('.navigation__element')
    if(e.target.classList.contains('navigation__element') || Boolean(navigationElement)) {
        const type = `${navigationElement.id}-template`;
        removeActiveClass(navigationElement);
        addActiveClass(navigationElement);
        renderRecipeDetails(type);
    }
})