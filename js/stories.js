"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 * - showDeleteBtn: show delete button?
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDelBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // show star when a user is logged in
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showDelBtn ? makeDelBtn() : ""}
        ${showStar ? makeStar(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}


// Make the favorite star symbol
function makeStar(story, user) {
  const isFavorite = user.isFavorite(story);
  const star = isFavorite ? "fas" : "far";
  return `
      <span class="star">
        <i class="${star} fa-star"></i>
      </span>`;
}

// Make delete button for story
function makeDelBtn() {
  return `
      <span class="trash-can">
        <i class="fas fa-trash-alt"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// To delete a story
async function delStory(e) {
  console.debug("delStory");

  const $closestLi = $(e.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  putUserStoriesOnPage();
}

$ownStories.on("click", ".trash-can", delStory);

// When users submit new story
async function submitNewStory(e) {
  console.debug("submitNewStory");
  e.preventDefault();

  // collect all info from form
  const author = $("#author").val();
  const title = $("#title").val();
  const url = $("#url").val();
  const username = currentUser.username;
  const storyData = { title, url, author, username };

  const story = await storyList.addStory(currentUser, storyData);

  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // hide the form and reset
  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory);


// List of user's own stories
function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append("<h5>You haven't added any stories!</h5>");
  } else {
    // loop through all of users stories and generate HTML for them
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}


// Put favorites list on page
function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h5>You don't have any favorite stories!</h5>");
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }

  $favoritedStories.show();
}

// Mark/unmarking a story as a favorite
async function toggleStoryFavorite(e) {
  console.debug("toggleStoryFavorite");

  const $click = $(e.target);
  const $closestLi = $click.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);

  // check if it's marked as favorite
  if ($click.hasClass("fas")) {
    // currently a favorite: remove from user's fav list and change star
    await currentUser.removeFavorite(story);
    $click.closest("i").toggleClass("fas far");
  } else {
    // currently not a favorite: do the opposite
    await currentUser.addFavorite(story);
    $click.closest("i").toggleClass("fas far");
  }
}

$storiesLists.on("click", ".star", toggleStoryFavorite);
