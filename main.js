function createElemWithText(tag = "p", text = '', className) {
    const newElem = document.createElement(tag);
    newElem.textContent = text;
    if (className) newElem.classList.add(className);
    return newElem;
}

function createSelectOptions(users) {
    if (!users) return;

    return users.map(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        return option;
    });
}

function toggleCommentSection(postId) {
    if (!postId) return;
    const section = document.querySelector(`section[data-post-id='${postId}']`);
    if (!section) return null;
    section.classList.toggle('hide');
    return section;
}

function toggleCommentButton(postId) {
    if (!postId) return;
    const button = document.querySelector(`button[data-post-id='${postId}']`);
    if (!button) return null;
    button.textContent =
        button.textContent === 'Show Comments' ? 'Hide Comments' : 'Show Comments';
    return button;
}

function deleteChildElements(parentElement) {
    if (!parentElement?.tagName) return;
    let child = parentElement.lastElementChild;
    while (child) {
        parentElement.removeChild(child);
        child = parentElement.lastElementChild;
    }
    return parentElement;
}

function addButtonListeners() {
    const main = document.querySelector('main');
    if (!main) return;
    const allButtons = main.querySelectorAll('button');

    allButtons.forEach((button) => {
        const postId = button.dataset.postId;
        if (!postId) return;

        const listener = (event) => toggleComments(event, postId);
        button.addEventListener('click', listener);
        button.listener = listener;
    });

    return allButtons;
}

function removeButtonListeners() {
    const main = document.querySelector('main');
    if (!main) return;

    const allButtons = main.querySelectorAll('button');

    allButtons.forEach((button) => {
        const postId = button.dataset.postId;
        if (!postId || !button.listener) return;

        button.removeEventListener('click', button.listener);
        delete button.listener;
    });

    return allButtons;
}

function createComments(comments) {
    if (!comments) return;
    const fragment = document.createDocumentFragment();

    comments.forEach(comment => {
        const article = document.createElement('article');
        article.classList.add('comment');

        const commentHeader = createElemWithText('h3', comment.name);
        const commentBody = createElemWithText('p', comment.body);
        const commentAuthor = createElemWithText('p', `From: ${comment.email}`)

        article.append(commentHeader, commentBody, commentAuthor);
        fragment.append(article);
    });
    return fragment;
}


function populateSelectMenu(users) {
    const selectMenu = document.querySelector('#selectMenu');
    if (!selectMenu || !users) return;

    const options = createSelectOptions(users);
    for (const option of options) {
        selectMenu.append(option);
    }
    return selectMenu;
}

//i didn't want to retype the full code per function so i made a helper
async function fetchHelper(path = '') {
    const url = `https://jsonplaceholder.typicode.com${path}`
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Error retrieving requested content: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error.message);
        return;
    }
}

async function getUsers() {
    return fetchHelper(`/users`);
}

async function getUserPosts(userId) {
    if (!userId) return;
    return fetchHelper(`/users/${userId}/posts`);
}

async function getUser(userId) {
    if (!userId) return;
    return fetchHelper(`/users/${userId}`)
}

async function getPostComments(postId) {
    if (!postId) return;
    return fetchHelper(`/posts/${postId}/comments`)
}

async function displayComments(postId) {
    if (!postId) return;

    const section = document.createElement('section');
    section.dataset.postId = postId;
    section.classList.add('comments', 'hide');

    const comments = await getPostComments(postId);
    const fragment = createComments(comments);

    section.append(fragment);
    return section;
}

async function createPosts(posts) {
    if (!posts) return;
    const newPost = document.createDocumentFragment();

    for (const post of posts) {
        const article = document.createElement('article');

        const header = createElemWithText('h2', post.title);
        const body = createElemWithText('p', post.body);
        const id = createElemWithText('p', `Post ID: ${post.id}`);

        const author = await getUser(post.userId);
        const authorData = createElemWithText('p', `Author: ${author.name} with ${author.company.name}`);
        const catchPhrase = createElemWithText('p', author.company.catchPhrase);

        const displayButton = createElemWithText('button', 'Show Comments');
        displayButton.dataset.postId = post.id;

        const section = await displayComments(post.id);

        article.append(header, body, id, authorData, catchPhrase, displayButton, section);
        newPost.append(article);
    }
    return newPost;
}

async function displayPosts(posts) {
    const main = document.querySelector('main');
    if (!main) return undefined;

    const element = posts?.length
        ? await createPosts(posts)
        : createElemWithText('p', 'Select an Employee to display their posts.', 'default-text');

    main.append(element);
    return element;
}

function toggleComments(event, postId) {
    if (!event || !postId) return;
    event.target.listener = true;

    const section = toggleCommentSection(postId);
    const toggleButton = toggleCommentButton(postId);

    return [section, toggleButton];
}

async function refreshPosts(posts) {
    if (!posts) return;

    const removeButtons = removeButtonListeners();
    const main = deleteChildElements(document.querySelector('main'));
    const fragment = await displayPosts(posts);
    const addButtons = addButtonListeners();

    return [removeButtons, main, fragment, addButtons];
}

async function selectMenuChangeEventHandler(event) {
    if (!event?.type || event.type !== 'change') return;

    const select = event.target || document.getElementById('selectMenu');
    if (!select) return undefined;

    select.disabled = true;

    let userId = select.value || 1;

    if (isNaN(userId)) {
        userId = 1;
    } else {
        userId = Number(userId);
    }

    const posts = await getUserPosts(userId);
    const refreshPostsArray = await refreshPosts(posts);

    select.disabled = false;

    return [userId, posts, refreshPostsArray];
}

async function initPage() {
    const users = await getUsers();
    const select = populateSelectMenu(users);
    return [users, select];
}

function initApp() {
    initPage();
    const select = document.getElementById('selectMenu');
    if (select) {
        select.addEventListener('change', selectMenuChangeEventHandler);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
