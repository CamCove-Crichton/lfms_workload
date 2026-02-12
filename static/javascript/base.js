// Document ready function
$(document).ready(function() {
    console.log('Document ready');
    // contentNavShift();
    // setContentHeight();
});

/**
 * Shifts the main content down when the navbar is toggled.
 *
 * @param {number} navHeight - The height of the navbar.
 * @returns {void}
 */
// function contentNavShift() {
//     $('.navbar-toggler').click(function() {
//         let navHeight = $('.navbar').height();
//         if ($('#main-content').css('margin-top') === '0px') {
//             // Navbar is open
//             $('#main-content').css('margin-top', navHeight + 'px');
//         } else {
//             // Navbar is closed
//           $('#main-content').css('margin-top', '0px');
//         }
//       });
// }

/**
 * Calculates and sets the height of the main content.
 * 
 * @returns {void}
 * @todo Make this function more dynamic.
 */
// function setContentHeight() {
//     let windowHeight = $(window).height();
//     let navHeight = $('.navbar').height();
//     $('#main-content').css('min-height', windowHeight - navHeight + 'px');
// }