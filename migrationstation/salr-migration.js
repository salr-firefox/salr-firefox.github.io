/**
 * @fileOverview Migration station v0.1
 * @author forums poster 'astral'
 * @license MIT
 */

/*
	This is v0.1 with no real error handling. USE AT YOUR OWN RISK!
	Special thanks to kripken for making the awesome SQL.js!
	You can get a copy of the MIT license at:
	https://opensource.org/licenses/MIT
*/
var db = new SQL.Database();

function init() {
	var dbFileElm = document.getElementById("dbfile");
	dbFileElm.value = dbFileElm.defaultValue;
	dbFileElm.addEventListener("change", function() {
		var f = dbFileElm.files[0];
		var r = new FileReader();
		r.onload = function() {
			var Uints = new Uint8Array(r.result);
			db = new SQL.Database(Uints);
		};
		r.readAsArrayBuffer(f);
	});
}

function doIt() {
	// Prepare a statement
	var stmt = db.prepare("SELECT `userid`, `color`, `background`, `notes`, `hideavatar` FROM `userdata` WHERE NOT (`color`='0' AND `background`='0' AND `hideavatar`='0' AND (`notes` is null OR `notes`=''))");
	stmt.getAsObject({$start:1, $end:1}); // {col1:1, col2:111}

	// Bind new values
	stmt.bind({$start:1, $end:2});
	var userNotes = {};
	var hiddenAvatars = [];
	while(stmt.step()) {
		var row = stmt.getAsObject();
		// Do we only need to set a hidden avatar? (don't create a note record)
		if ((!row.notes || row.notes === '') && row.color === '0' && row.background === '0') {
			hiddenAvatars.push(row.userid);
			continue;
		}

		// Fix specific old notes
		if (row.notes === 'SALR 2.0 Developer') {
			if (row.userid === 53580)
				row.notes = 'SALR Developer';
			else 
				row.notes = 'Legacy Firefox SALR Developer';
		}
		else if (row.notes === 'SALR Creator' && row.userid === 20065)
			row.notes = 'Legacy Firefox SALR Creator';

		// redux key is user id, subkeys: text, color, bgcolor
		userNotes[row.userid] = {
			'text': row.notes
		};
		if (row.color && row.color !== "0")
		userNotes[row.userid].color = row.color;
		if (row.background && row.background !== "0")
			userNotes[row.userid].bgcolor = row.background;
		if (row.hideavatar === 1)
			hiddenAvatars.push(row.userid);
		//console.log(row);
	}

	// Add new notes for SALR Redux dudes
	var prefabNotes = new Map([[ "50339"   , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // Sebbe
		["3882420" , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // Onoj
		["143511"  , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // Sneaking Mission
		["156041"  , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // wmbest2
		["115838"  , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // Ferg
		["101547"  , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // Rohaq
		["163390"  , {'text' : 'SALR Developer', 'color' : '#9933FF'}], // Master_Odin
		["53580"   , {'text' : 'SALR Developer', 'color' : '#003366'}]  // astral
	]);
	for (var [prefabId, prefabNote] of prefabNotes) {
		if (!userNotes[prefabId])
		{
			userNotes[prefabId] = prefabNote;
		}
	}

	var userNotesString = JSON.stringify(userNotes);
	var hiddenAvatarString = JSON.stringify(hiddenAvatars);
	var inputString = document.getElementById("existing-input").value;
	var finalString = createReduxSettingsString(userNotesString, hiddenAvatarString, inputString);
	var output = document.getElementById("output");
	output.readOnly = true;
	output.value = finalString;
}

/**
* Migration time! Create a setting string to paste into Redux
* @param {string} userNotesString Valid SALR Redux userNotesLocal string
* @param {string} hiddenAvatarString Valid SALR Redux hiddenAvatarsLocal string
* @param {string} [inputString] Optional existing SALR Redux settings
* @return {string} Valid SALR Redux settings string
*/
function createReduxSettingsString(userNotesString, hiddenAvatarString, inputString)
{
	var reduxSettings;
	if (typeof inputString === "string" && inputString !== '') {
		reduxSettings = JSON.parse(inputString);
		reduxSettings.enableUserNotes = 'true';
		reduxSettings.enableUserNotesSync = 'false';
		reduxSettings.enableToggleUserAvatars = 'true';
		if (reduxSettings.userNotes)
			delete reduxSettings.userNotes;
	}
	else {
		// Setting names.
		reduxSettings = {
			'salrInitialized':              'true',
			'username':                     '',
			'usernameCase':                 'false',

			// Thread Highlighting
			'hightlightThread':             'false',
			'darkRead':                     '#bbccdd',
			'lightRead':                    '#ddeeff',
			'darkNewReplies':               '#cfdfcf',
			'lightNewReplies':              '#e1f1e1',
			'displayCustomButtons':         'true',
			'inlinePostCounts':             'false',

			// Post Highlighting
			'highlightOP':                  'false',
			'highlightOPColor':             '#fff2aa',
			'highlightSelf':                'false',
			'highlightSelfColor':           '#f2babb',
			'highlightOwnQuotes':           'true',
			'userQuote':                    'true',
			'highlightOwnUsername':         'false',
			'usernameHighlight':            '#9933ff',
			'highlightFriends':             'false',
			'highlightFriendsColor':        '#f2babb',
			'highlightModAdmin':            'false',
			'highlightModAdminUsername':    'false',
			'highlightModeratorColor':      '#b4eeb4',
			'highlightAdminColor':          '#ff7256',

			// Forum Display Options
			'hideAdvertisements':           'false',
			'displayNewPostsFirst':         'false',
			'displayNewPostsFirstForum':    'true',
			'displayNewPostsFirstUCP':      'true',
			'showLastThreePages':           'false',
			'postsPerPage':                 'default',
			'showLastThreePagesForum':      'true',
			'showLastThreePagesUCP':        'true',
			'showLastThreePagesThread':     'true',

			// Header Link Display Options
			//'hideHeaderLinks':              'true',
			'showPurchases':                'true',
			'topPurchaseAcc':               'true',
			'topPurchasePlat':              'true',
			'topPurchaseAva':               'true',
			'topPurchaseArchives':          'true',
			'topPurchaseNoAds':             'true',
			'topPurchaseUsername':          'true',
			'topPurchaseBannerAd':          'true',
			'topPurchaseEmoticon':          'true',
			'topPurchaseSticky':            'true',
			'topPurchaseGiftCert':          'true',
			'showNavigation':               'true',
			'topNavBar':                    'true',
			'bottomNavBar':                 'true',
			'topSAForums':                  'true',
			'topSALink':                    'true',
			'topSearch':                    'true',
			'displayConfigureSalr':         'true',
			'topUserCP':                    'true',
			'topPrivMsgs':                  'true',
			'topForumRules':                'true',
			'topSaclopedia':                'true',
			'topGloryhole':                 'true',
			'topLepersColony':              'true',
			'topSupport':                   'true',
			'topLogout':                    'true',
			'expandBreadcrumbs':            'false',
			'displayMods':                  'false',
		
			// Thread Options
			'showUserAvatarImage':          'true',
			'showUserAvatar':               'true',
			'hideUserGrenade':              'false',
			'hideGarbageDick':              'false',
			//'hideStupidNewbie':             'false',
			'inlineVideo':                  'false',
			//'embedVideo':                   'false',
			'youtubeHighlight':             '#ffcccc',
			'inlineVine':                   'false',
			'dontReplaceVineNWS':           'false',
			'dontReplaceVineSpoiler':       'false',
			'inlineWebm':                   'false',
			'inlineWemAutoplay':            'true',
			'dontReplaceWebmNWS':           'false',
			'dontReplaceWebmSpoiler':       'false',
			'threadCaching':                'false',
			'boxQuotes':                    'false',
			'salrLogoHide':                 'false',
			'whoPostedHide':                'false',
			'searchThreadHide':             'false',
			'enableUserNotes':              'true',
			'enableUserNotesSync':          'false',
			'enableToggleUserAvatars':      'true',
			'enableThreadNotes':            'false',
			'fixCancer':                    'true',
			'adjustAfterLoad':              'true',
			'preventAdjust':                'false',
			'enableSOAPLink':               'false',
			'enableSinglePost':             'true',
			'hidePostButtonInThread':       'false',
			'removeOwnReport':              'true',
			'collapseTldrQuotes':           'false',
		
			// Control Options
			'displayPageNavigator':         'true',
			'loadNewWithLastPost':          'true',
			'displayOmnibarIcon':           'false',
			'enableKeyboardShortcuts':      'false',
			'enableMouseGestures':          'false',
			'enableMouseMenu':              'false',
			'enableMouseUpUCP':             'false',
			'enableQuickReply':             'true',
			'quickReplyParseUrls':          'true',
			'quickReplyBookmark':           'false',
			'quickReplyDisableSmilies':     'false',
			'quickReplySignature':          'false',
			'quickReplyLivePreview':        'false',
			'quickReplyFormat':             'true',
			'quickReplyEmotes':             'true',
			'quickReplyYoutube':            'true',
		
			// Image Display Options
			'replaceLinksWithImages':       'false',
			'dontReplaceLinkNWS':           'false',
			'dontReplaceLinkSpoiler':       'false',
			'dontReplaceLinkRead':          'false',
			'dontReplaceLinkImage':         'false',
			'imageLinkHover':               'false',
			'imageLinkHoverDelay':          '0.5',
			'imageLinkHoverShowURL':        'true',
			'imageLinkHoverShowFilename':   'false',
			'replaceImagesWithLinks':       'false',
			'replaceImagesReadOnly':        'false',
			'replaceImagesLink':            'false',
			'restrictImageSize':            'false',
			'restrictImagePxW':             '800',
			'restrictImagePxH':             '800',
			'fixImgurLinks':                'true',
			//'fixTimg':                      'false',
			//'forceTimg':                    'false',
			'retinaImages':                 'false',
			'setImageTooltip':              'false',
			'setImageTooltipBlankOnly':     'true',
			'setImageTooltipHideExtension': 'true',
			'setImageTooltipSkipEmoticons': 'true',
			'setImageTooltipHideSourceUrl': 'true',
		
			// Other Options
			'qneProtection':                'false',
			'showEditBookmarks':            'false',
			'openAllUnreadLink':            'true',
			//'ignoreBookmarkStar':         "";
			'ignoreBookmarkStarGold':       'false',
			'ignoreBookmarkStarRed':        'false',
			'ignoreBookmarkStarYellow':     'false',
			'openAllForumUnreadLink':       'true',
			'ignoreForumStarNone':          'false',
			'ignoreForumStarGold':          'false',
			'ignoreForumStarRed':           'false',
			'ignoreForumStarYellow':        'false',
			'fixUserCPFont':                'false',
		
			// Misc Options (don't show up on settings.html)
			'MouseActiveContext':           'false'
		};
	}

	reduxSettings.userNotesLocal = userNotesString;
	reduxSettings.hiddenAvatarsLocal = hiddenAvatarString;

	return JSON.stringify(reduxSettings);
}

document.addEventListener("DOMContentLoaded", init);
