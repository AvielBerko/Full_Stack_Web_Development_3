/*
This module holds utility functions used accross the site.
*/
function loginout() {
    if (active_user != null) {
        localStorage.removeItem('active_user');
        location.reload();
    }
    else {
        load_login_page(true);
    }
}