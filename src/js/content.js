(() => {
  console.log('Commenter Subscribers for YouTube™');

  /**
   * Returns the subscriber count string of a given youtube channel.
   * If subscriber count is private, <i>Private</i> is returned.
   * @param {string} channelUrl the url of a given youtube channel.
   * Should be of the form: https://www.youtube.com/channel/<channel id>
   */

  // I tried but I failed adding proper javascript that would do that
  // I will bodge in the hover functionality with a style tag in the head element

  const cssHack = "<style>.description{display:none;}.tiptext:hover>.description{display:inline-block;}</style>";
  document.head.insertAdjacentHTML("beforeend", cssHack);

  const getSubs = async (channelUrl) => {
    // It appears that occasionally the channelUrl is missing the https:// prefix.
    // As of 2025-01-31, this occurs on community post comments.
    if (channelUrl.startsWith('http://')) {
      channelUrl = channelUrl.replace('http://', 'https://');
    }

    const response = await fetch(channelUrl + '/about');
    const text = await response.text();

    // Get subscriber count string.
    // The returned HTML contains a large JSON that has the sub count as
    // a rendered string in a field called "subscriberCountText".
    // e.g. ... "subscriberCountText":"12.4K subscribers" ...

    // Added other regexes covering everything I want to include:
    const regexSubCount = /"subscriberCountText":"([^"]+)"/;
    const regexVidCount = /"videoCountText":"([^"]+)"/;

    // We extract the info above from the "/about" box/
    // Info below is regexed from other places on the page,
    // "\} in viewCountText is there to filter out shorts from standard videos
    // we use ? to filter out rss feed channel id

    const regexVidName        = /"title":\{"accessibility":\{"accessibilityData":\{"label":"((?:(?:\\")|[^"])+)"/;
    const regexTitles         = /"title":\{"accessibility":\{"accessibilityData":\{"label":"((?:(?:\\")|[^"])+)"/g;
    // This will be cleaned up I just want ts to work, grabbing appropriate viddate/vidviews more consistantly
    const fullInfoRegex       = /"title":\{"accessibility":\{"accessibilityData":\{"label":"(?:(?:(?:\\")|[^"])+)"\}\},"simpleText":"(?:(?:(?:\\")|[^"])+)"\},"publishedTimeText":\{"simpleText":"([^"]+)"\},"viewCountText":\{"simpleText":"([^"]+)"/
    // This is used for rare situations where there is no "Videos" box.
    const regexVidDate        = /"publishedTimeText":\{"simpleText":"([^"]+)"/;
    const regexVidViews       = /"\},"viewCountText":\{"simpleText":"([^"]+)"/;
    const regexID             = /\?channel_id=([^"]+)/;

    const regexNewVidID = /[^\]]\},"content":\{"horizontalListRenderer":\{"items":\[\{"gridVideoRenderer":\{"videoId":"([^"]+)"/;
    var matchNewVidID = text.match(regexNewVidID);
    var nulltestNewVidID = matchNewVidID ? matchNewVidID[1] : "(?!.*)";

    //Shorts are horizontal, normal vids are not, this can swap if needed
    var thumbnailHeight = 105;
    var thumbnailWidth =  140;

    // We grab the subscriberCountText field.
    const SubCount = text.match(regexSubCount);

    // User has set their subscriber count to private.
    // We detect this if the subscriberCountText field is missing.
    // We use a ? : to check if the SubCount is null, if so we return "Private"
    // else we force it into a new variable
    const SubCountText = SubCount ? SubCount[1] : '<i>Private</i>';

    //We grab the videoCountText field.
    const VidCount = text.match(regexVidCount);

    // User has no videos.
    // We detect this if the videoCountText field is missing.
    if (VidCount === null){
        return SubCountText + ' | 0 videos';
    } else {
        // We find the hidden playlist with all videos manipulating channelID
        // We will use it later when we will create a link to it
        // We will use the ID later.
        var matchID = text.match(regexID);
        const playlist = matchID[1].replace('UC', 'https://www.youtube.com/playlist?list=UU');

        // I still decided to do this because matchAll returns an iterator
        // it blinks when function is looping morover, it's ugly, moreover it's a cleaner
        // way to get a null value on vidname if nothing gets caught
        var VidName = text.match(regexVidName);
        var titles = text.matchAll(regexTitles);
        // We set this flag for use later to differentiate if the user has shorts only
        var shorts = 0;
        var VidViews = ""
        var finalVidViews = "";
        var finalVidDate = "";
        const regexShortClean = /,\s([^,]+)\s[–-]\s[^–-]+$/;

        if (VidName === null) {
           // We apply those regexes for shorts, and /videos like layout on the main page
           const regexShortsTitles = /"entityId":"shorts-shelf-item-(?:[^"]+)","accessibilityText":"((?:(?:\\")|[^"])+)"/g;
           const shortsTitles = text.matchAll(regexShortsTitles);
           titles = shortsTitles;
           const regexShortsInfo = /"entityId":"shorts-shelf-item-([^"]+)","accessibilityText":"((?:(?:\\")|[^"])+)","thumbnail":\{"sources":\[\{"url":"([^"]+)"/;
           const shortsInfo = text.match(regexShortsInfo);
           if (shortsInfo !== null){
             shorts = 1;
             thumbnailHeight = 140;
             thumbnailWidth =  105;
             nulltestNewVidID = shortsInfo[1];
             shortsClean = shortsInfo[2].match(regexShortClean);
             VidName = ["", shortsInfo[2].replace(shortsClean[0], "")];
             finalVidThumbnail = shortsInfo[3];
             finalVidViews = shortsClean[1];
           } else {
             // this is super silly, it filters out Avatar Image (88px), will clean it up later if i get around to it
             const regexVidNameAlt = /[^8{2}]\}\],"accessibility":\{"accessibilityData":\{"label":"((?:(?:\\")|[^"])+)"/;
             const regexPlaylistTitlesAlt = /\}\],"accessibility":\{"accessibilityData":\{"label":"((?:(?:\\")|[^"])+)"/g;
             const regexNewVidIDAlt = /{"videoRenderer":\{"videoId":"([^"]+)"/;
             VidName = text.match(regexVidNameAlt);
             titles = text.matchAll(regexPlaylistTitlesAlt);
             const newVidIDAlt = text.match(regexNewVidIDAlt);
             nulltestNewVidID = newVidIDAlt ? newVidIDAlt[1] : "";

             // // It seems too much, for the fraction of a fraction of channels that will fail all the other attempts to scrape.
             // // For now at least. Also I would need to scrape vid views/vid date differently
             // if (VidName === null){
             //    const playlistResponse = await fetch(playlist);
             //    const playlistText = await playlistResponse.text();
             //    console.log(playlistText);
             //    const regexPlaylistTitles = /\}\],"accessibility":\{"accessibilityData":\{"label":"((?:(?:\\")|[^"])+\d[^"]+)"\}\}\},/g;
             //    const regexNewVidIDAlt = /\{"playlistVideoRenderer":\{"videoId":"([^"]+)"/;
             //    VidName = playlistText.match(regexPlaylistTitles);
             //    console.log(VidName);
             //    titles = playlistText.matchAll(regexPlaylistTitles);
             //    const testNewVidID = playlistText.match(regexNewVidIDAlt);
             //    console.log(nulltestNewVidID);
             // }
           };
         };

        const stringVidThumbnail = "https://i.ytimg.com/vi/" + nulltestNewVidID + "(:?[^\"]+)";
        const regexVidThumbnail  = new RegExp(stringVidThumbnail, "");
        const matchVidThumbnail = text.match(regexVidThumbnail);
        var finalVidThumbnail = matchVidThumbnail ? matchVidThumbnail[0] : "";

        //Using /regexpr/g and matchAll we get an object that can be iterated on
        //We plug it into this fuction, repeat it 20 times and then "break"
        // "&#010;" is an html code for a newline, so title+newline+title+newline etc.
        var forloopoutput = "";
        var forIter = 0;
        for (const title of titles) {
           if (shorts == 1){
             // We use this short regex to remove the "- Watch Shorts" text
             const matchShortClean = title[1].match(regexShortClean);
             title[1] = title[1].replace(matchShortClean[0], "");
           }
          //This lets us avoid issues with parcing " in title name
          forloopoutput += title[1].replaceAll("\\\"", "&quot;") + "&#010;";
          forIter += 1;
          if (forIter > 19) break;
        }

        // We create and style videocount to behave as a link to our hidden playlist
        // We add a newline seperated list of titles created by the for loop above on hover
        const textVidCount = "<a style=\"color:#ddd;\" href=\""+ playlist + "\" title=\"" + forloopoutput + "\">" + VidCount[1] + "</a>";

        // All scraping attemps failed but videos exist, for now we metion this fact.
        if (VidName === null) {
          return SubCountText + ' | ' + textVidCount + ' | fail';
        } else {
        if (shorts == 0) {
          const nulltestVidViews = text.match(regexVidViews) ? text.match(regexVidViews)[1] : "error";
          const nulltestVidDate = text.match(regexVidDate) ? text.match(regexVidDate)[1] : "error";
          const VidInfo = text.match(fullInfoRegex) ? text.match(fullInfoRegex) : ["", nulltestVidViews, nulltestVidDate];
          finalVidDate = VidInfo[1];
          finalVidViews = VidInfo[2];
        };

        // We do this regex to seperate the name from the title
        // (?:foo)      treat all those searches as a block, don't output seperately
        //\s            whitespace character (space)
        //[0-9]{1,2}    0-99
        //\S*           0 or any number of non-whitespace characters
        //[^\d\s]+      1+ of a [NOT \d = 0-9 and \s = whitespace ]
        //foo?          "foo" or a lack of "foo"
        //$             end of string
        // Bugs be plenty with this naive way of doing it, chinese, arabic are broken
        const regexVidLenght = /(?:\s?[0-9]{1,2}\s?[^\d\s]+)?(?: [^\d\s]|,)? [0-9]{1,2} [^\d\s]+$/;
        const VidLenght = VidName[1].match(regexVidLenght) ? VidName[1].match(regexVidLenght) : "short";
        const textVidName = VidName[1].replace(VidLenght, '').replaceAll('\\','');


        // Now we have matches for all the videos.
        // We return match group 1 because that's where the newest video will be (like 60% of the time).

        const hoverVidThumbnail = "<div class=\"description\"  style=\"position:absolute;border:1px solid #000;width:" + thumbnailWidth + "px;height:" + thumbnailHeight + "px;inset-block-start:-" + thumbnailHeight + "px;background-image:url("+ finalVidThumbnail +");background-size:cover;\"></div>";
        const finalVidName = "<a class=\"tiptext\" style=\"color:#ddd;text-decoration:none;\" href=\"https\://youtu.be/" + nulltestNewVidID + "\">" + hoverVidThumbnail + textVidName + "</a>";
        return SubCountText + ' | ' + textVidCount + ' | <b>' + finalVidName + '</b> | ' + VidLenght + ' | '+ finalVidViews + ' | ' + finalVidDate;
      };
    };
  };

  /**
   * Adds the sub count to a given comment element.
   * If the comment already has a sub count, this is removed first.
   * @param {HTMLElement} commentElement an element which contains a single comment
   */
  const addCommentSubCount = async (commentElement) => {
    const channelUrlLookup = 'div#header-author a';
    const commentHeaderElement =
      commentElement.querySelector('div#header-author');

    // Remove any existing subscriber counts
    commentHeaderElement.querySelectorAll('.subscriber-count').forEach((el) => {
      commentHeaderElement.removeChild(el);
    });

    const channelUrl = commentElement.querySelector(channelUrlLookup).href;
    const subCount = await getSubs(channelUrl);

    // Add new subscriber count
    const subCounterSpan = document.createElement('span');
    commentHeaderElement.appendChild(subCounterSpan);
    subCounterSpan.className = 'subscriber-count';
    subCounterSpan.innerHTML = subCount;
    subCounterSpan.style.fontSize = '1.1rem';
    subCounterSpan.style.lineHeight = 'normal';
    subCounterSpan.style.color = '#ddd';
    subCounterSpan.style.backgroundColor = '#333';
    subCounterSpan.style.marginLeft = '4px';
    subCounterSpan.style.padding = '1px 3px 1px 3px';
    subCounterSpan.style.borderRadius = '3px';

    /*
      When navigating between videos, comment elements are not recreated and so
      addCommentSubCount is not triggered. This means the subscriber count will
      represent that of a channel from a previous video instead of the current.

      To fix this, we listen for changes to the href of the comment to trigger
      an update to the subscriber count.
    */
    const observer = new MutationObserver((mutationsList) => {
      mutationsList
        .filter(
          (mutation) =>
            mutation.type === 'attributes' && mutation.attributeName === 'href'
        )
        .forEach(async () => {
          // Hide element while we fetch new subscriber count
          subCounterSpan.style.visibility = 'hidden';
          const channelUrl =
            commentElement.querySelector(channelUrlLookup).href;
          subCounterSpan.innerHTML = await getSubs(channelUrl);
          subCounterSpan.style.visibility = 'visible';
        });
    });

    observer.observe(commentElement.querySelector(channelUrlLookup), {
      childList: false,
      subtree: false,
      attributes: true,
    });
  };

  // Process all comment elements that don't already have subscriber counts
  const processComments = () => {
    const comments = document.querySelectorAll(
      'ytd-comment-view-model:not([data-sub-count-added])'
    );
    comments.forEach((comment) => {
      comment.setAttribute('data-sub-count-added', 'true');
      addCommentSubCount(comment);
    });
  };

  // Process comments that are already on the page
  processComments();

  // Create an observer to listen for any new comment elements
  const observer = new MutationObserver(() => {
    processComments();
  });

  // Listen for changes on the entire document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
