# Ohio Ihsan Academy
## Website update guide

**For school staff and the next website maintainer**  
Prepared October 12, 2026 • Local review edition

> **This is a local preview.** Saving in the editor changes this copy of the website on your computer. It does not publish to oiacademy.org, WordPress, or GitHub.

### Start here

1. Open the website project folder and double-click **Edit Website.command**.
2. The browser opens **Website updates**. If Node.js is missing, ask the maintainer to install it first. Keep the Terminal window open while you work.
3. Edit a newsletter or activity, choose **Save updates**, then **Open saved website preview** to review.
4. Send the reviewed changes to the website maintainer for the approved publishing process.

### What you can update

- **Family Newsletter:** add or correct a newsletter title, publication date, and public viewing link. The existing page design stays the same.
- **Life at OIA:** add or edit school events. The homepage link opens a separate activities page showing events that overlap the current month in Ohio.
- **Events Calendar:** edit the linked Google Doc directly. The website link keeps pointing to that live document.
- **Reading Challenge scoreboard:** update its source Google Sheet. Its published chart updates through Google.

### Keep these three places separate

**The editor** is where you change this local copy.  
**The preview** is where you check what families will see.  
**The live website** changes only after a maintainer publishes an approved release.

[Open the local editor](http://127.0.0.1:4174/editor/) • [Open the local website preview](http://127.0.0.1:4174/) • [Visit the live website](https://oiacademy.org/)

The local links work only while the editor is running on this computer. Share a reviewed preview through the maintainer's chosen review method; a 127.0.0.1 link will not open your computer for someone else.

<!-- PAGE BREAK -->

## 1. Add a Family Newsletter

The newsletter remains a link to the school-approved newsletter. You do not need to change its page layout or edit website code.

### Prepare a link families can open

1. Finish the newsletter in the school's chosen tool, such as Canva or Google Drive.
2. Copy a **viewing link**, not an editing link. For a PDF, use the school's approved public hosting or sharing location.
3. Open that link in a private or incognito browser window while signed out. Confirm families can read it without requesting access or signing in.

### Add it to the local website

1. Open the editor and find **Family newsletters**.
2. Choose **Add newsletter**. Enter **Newsletter title**, **Newsletter date**, and **Newsletter link**. The link must start with **https://**; the short description is optional.
3. Choose **Save updates**. After the saved message, choose **Open saved website preview** and go to **Student Life → Family Newsletter**.
4. Check the title and date. Open the newsletter link and confirm it is the right edition.

### Correct or remove an entry

Open the existing entry to correct its title, date, or link. **Remove newsletter** removes that website listing; the source newsletter in Canva or Drive is separate from its website link. Save and review again.

> **Privacy check:** Do not place student records, private contact details, or a restricted staff document behind a public website link. Use the school-approved family edition.

Before requesting publication, give the maintainer the newsletter title, publication date, working public link, and the reviewed local change. Local saving alone does not make the newsletter live.

<!-- PAGE BREAK -->

## 2. Update Life at OIA

**Life at OIA** sits below the tour invitation on the homepage. Clicking it opens the separate activities page. That page shows this month’s activity cards; **Learn More** opens a focused detail window with participation instructions, the submission form, and the live scoreboard.

### Add an event

1. Open **School activities** and choose **Add activity**.
2. Enter **Activity title**, an optional subtitle, and **Short introduction**.
3. Set **Activity starts** and **Activity ends (including this day)**. Use the same date for a one-day event.
4. Fill **How it works**, with one paragraph per line. Add any submission/signup link and instructions. Notes, scoreboard, rewards, and announcement are optional.
5. Choose **Save updates**, then open the preview. Follow **Life at OIA**, check the card, and choose **Learn More**. Confirm every detail and link.

### How monthly display works

An event appears when its date range overlaps the current month in **America/New_York**, Ohio's time zone. An event lasting from October 25 to November 5 can appear in both October and November. An October-only event disappears when November begins.

The activities page is a monthly overview. An event earlier in the current month can still appear until that month ends. A future-month event will not appear yet. If there are no events for the month, the activities page shows a short check-back message.

### Edit or archive an event

Correct the existing record when a date or detail changes. Leave ended events in the editor for your records; they disappear automatically when their final month ends. **Remove activity** deletes its website record. There is no separate archive button. Save and review again.

> **One event is enough.** Add only the events the school has confirmed. You do not need filler cards or extra activities to complete a layout.

For the Iqra' Reading Challenge, choose **Learn More** and review the details, submission link, important notes, scoreboard, and adult/student outcomes. A website event card does not submit an entry to the challenge.

<!-- PAGE BREAK -->

## 3. Calendars and Friday programs

### School Calendar

The **School Calendar** shows the academic year as a compact agenda. Month links jump to dates. Send approved date changes to the website maintainer.

### Events Calendar

Choose **View Event Calendar** inside the School Calendar resource or on the school calendar page. It opens the school's live Google Doc. Edit that document in Google Docs as usual; changes are available through the same website link without rebuilding the local website. Keep the document's family viewing permissions correct.

If the Doc changes, test its new public link, replace **Event calendar link** in the editor, and save. The maintainer publishes the reviewed change.

[Open the current Events Calendar](https://docs.google.com/document/d/1iZYN2hKL4oY3Tf_pqSfcZHOyagnpOc9rmVmAuCIyZWk/edit?usp=sharing)

### Jumu'ah Bites

Jumu'ah Bites is the standing Friday food program for students. The homepage notice links directly to the existing order form. Its closed-orders message has one additional sentence giving the monthly deadline:

> **Orders for the month must be submitted by Wednesday at 9 a.m. before the first Friday of that month. Times are Ohio local time.**

There is no extra Bites page. **WordPress/WPForms controls whether the existing form accepts orders.** The deadline note does not reopen it.

If a parent sees **orders closed**, direct them to the deadline note. If the form's real status seems incorrect, the person managing the form must check its WordPress settings. Changing the local editor does not reopen the form.

[Open the real Jumu'ah Bites order form](https://oiacademy.org/jumah-bites-2/)

### Jumu'ah volunteers

The volunteer page invites fathers to accompany the boys to the musalla while classroom teachers accompany the girls. The signup button opens the school's existing signup form. Update signup information in that form. If its address changes, update **Jumu’ah volunteer signup link** in **Activity heading & family links**, then save and request publication.

[Open the current volunteer signup](https://www.signupgenius.com/go/10C054BAEAA2BA2F5C70-65791301-jumua#/)

<!-- PAGE BREAK -->

## 4. Reading Challenge and live results

The Iqra' Reading Challenge appears on the separate Life at OIA activities page. Learn More opens its detail window, with a submission form and live published scoreboard. Each has a different owner and update path.

### Update challenge information

Use the event editor for supported event fields. The challenge activity includes its introduction, **How it works**, submission instructions, important notes, published scoreboard embed link, adult/student rewards, and announcement. Use one paragraph or note per line in the relevant fields.

Changes to rules, scoring, submission deadlines, or rewards must come from the school's approved source. Ask the website maintainer to update any detail that is not offered by the editor. Do not change the website's rules independently of the real challenge.

### Submit reading minutes or videos

The **submission form** is the place families enter reading minutes and recommendation videos. The website button opens that form. The school manages submissions in the form's own system; the local website does not receive or store them.

The school-provided instructions call for daily or weekly submissions, with all minutes for the week submitted by Sunday night. Keep the form and published instructions aligned if the school changes this rule.

[Open the Reading Challenge submission form](https://forms.gle/98y9pFBdzcMXa4fB8)

### Update the live scoreboard

1. Open the school-owned Google Sheet that feeds the published scoreboard. Its published viewing link is not a link for editing the source sheet; ask the chart owner for access if needed.
2. Update the approved totals in the source cells. Keep the chart connected to the correct totals.
3. Open the website preview, choose **Learn More**, and refresh after Google has updated the published chart.
4. Confirm the adults and students are labeled correctly and that the totals match the source sheet.

On a phone, swipe or scroll sideways inside the scoreboard to see the full chart.

Google controls the timing of published chart refreshes. A short delay does not mean the website needs a new release. If the chart remains blank, the maintainer should check the published chart link and Google sharing/publishing settings.

> **Sharing check:** Publish only the team scoreboard intended for families. Do not publish individual student data or private submission records.

If the Sheet or chart is replaced, update **Published scoreboard embed link** in the activity. Use the published Google Sheets chart URL, not its iframe code. The website also offers a viewing link beside the chart.

[Open the current published scoreboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vTB2DUyLl07druxs6yHJJ33utX7PSLQTOS7aRHE-FjhPqmu767wDMtdJMFtNIRnX9IweQ43ppLR6hq9/pubchart?oid=1335978078&format=interactive)

<!-- PAGE BREAK -->

## 5. Review and recover safely

### Before sending changes for publication

1. Save successfully and confirm there is no error message.
2. Open the preview and check the homepage, **Student Life**, **Family Newsletter**, and any event or program page you changed.
3. Click every new or changed link. For family documents, repeat the check in a private window without a school login.
4. Review on a phone-sized window as well as the full desktop width. Check that the text is readable and buttons are easy to use.
5. Confirm event dates, newsletter dates, school-approved wording, and the destination of every form button.

The local form screens are previews. Use the real external form only when you intend to complete a real submission; viewing a local page does not validate form acceptance or email delivery.

### If you cannot see your change

Refresh the preview after a successful save. Confirm you are viewing **127.0.0.1:4174**, not **oiacademy.org**. If the event is for another month or has finished in a past month, it may correctly be hidden from the current activities page.

### If a save fails

Read the error shown in the editor. Correct missing or invalid fields and save again. If the error remains, give the maintainer the message and keep a copy of your intended change. Do not assume it was saved or published.

### If you made a mistake

Use the editor to correct it and save again. A save keeps the previous content in **family-updates.previous.json**. This is one previous version, replaced on the next save. Ask the maintainer to restore it before saving again if you need that version.

### When you finish

Keep the project folder and its previous-content backup together. Close the editor's Terminal window, or stop it with **Control-C**, when no one is using the preview. The local links stop working once the editor stops.

<!-- PAGE BREAK -->

## 6. For the next website maintainer

### The source map

| Place | What it controls |
|---|---|
| `content/family-updates.json` | Staff-managed newsletters, events, and program/document links |
| `scripts/build-redesign.mjs` | Rebuilds shared and generated content |
| `scripts/family-content.mjs` | Validates content and renders newsletters/events |
| `scripts/edit-content.mjs` and `scripts/content-editor.html` | Local editing, backup, rebuild, and preview |
| `assets/redesign/*.css` | Shared website and page-family layouts |
| `site.js` and `family-dates.mjs` in `assets/redesign/` | Popup, activity windows, Ohio months and deadlines |
| `shared/header.html`, `footer.html`, `family-icons.svg` | Navigation, footer and resource icons |
| `2026-2027-calendar/index.html` | Academic calendar dates and event rows |
| `siteground/oia-static-router.php` | Production hybrid routing and release location |
| `scripts/build-siteground-package.mjs` | Builds the SiteGround release package |

Keep JSON authoritative. Use the editor or update the source JSON and rebuild; generated newsletter and activity HTML is replaced during builds.

### Local commands

From the project folder, with Node.js and npm installed:

```text
npm run edit
npm run build
npm run verify
npm run package:siteground
```

**edit** opens the editor; **build** refreshes pages; **verify** checks the site; **package:siteground** creates local release files. Resolve check failures before release. These commands do not publish.

Preserve the frozen original baseline; set `OIA_BASELINE_DIR` to its location if needed. Keep existing local form-safety boundaries.

<!-- PAGE BREAK -->

## 7. Release and maintenance

### How the live website works

The site uses a **hybrid WordPress arrangement**. A router serves an explicit list of informational pages from an approved static release. WordPress continues to own forms, accounts, payments, administration, and routes outside that list.

The original **/jumah-bites-2/** order-form route stays in WordPress; there is no extra Bites page. The local preview adds only a deadline sentence beneath the closed-orders message. Apply that same sentence in the live WPForms locked-message setting during an approved release. **/life-at-oia/** contains the monthly activities; **/jumua-volunteer/** contains volunteer information and the signup link.

When adding static routes, update both the router whitelist and the SiteGround package route list. The package script checks that they agree. Keep form submission routes outside the static whitelist.

### A future approved release

1. Rebuild the local site, run verification, and review the exact final diff with the owner.
2. Package the reviewed files. Confirm every new informational route is included and the release-specific path is correct.
3. Keep a recoverable copy of the current live release and router settings. Review the candidate in the approved staging or review environment.
4. Obtain the owner's specific approval before any push or live deployment. Local editor saves and package creation are not that approval.
5. After the approved release, verify the public routes, new links, shared navigation, monthly events, newsletter links, and chart embed. Check the real order and signup flows without creating unintended submissions.
6. Record the deployed release and rollback location. A healthy page response alone does not prove that a real form accepts orders or delivers email.

### Restore a content backup

Stop the editor, preserve the current content file, and copy `content/family-updates.previous.json` over `content/family-updates.json`. The backup keeps only the previous save, so copy it elsewhere before another save if it must be retained. Then run **npm run build** and **npm run verify**, restart the editor, and review the restored preview. Restoration is local until an approved release is published.

### Keep maintenance small

Use the editor for routine newsletters and events. Use Google Docs for the live Events Calendar and the source Google Sheet for the Reading Challenge scoreboard. Ask the maintainer for academic calendar changes, new routes, or changes outside the editor's supported fields.

This guide covers the October 2026 local update. Use current source and approved release settings; `WORDPRESS-HANDOFF.md` is a historical design reference.
