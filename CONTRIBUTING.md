# Contributing to Pathways

Right now, development is being done entirely by the Taskar Center. The best way to contribute is to help us test out features as they're added, and give us feedback on what would make mapping better for you. 

## Development Style

This code base is developed using a style based off of the [Git Flow](http://danielkummer.github.io/git-flow-cheatsheet/) methodology. In short:

* New features should be made on a dedicated branch, created from the `develop` branch
* When it's done, merge the `feature` branch into `develop`
* Close the `feature` branch
* When it's time for release, create a new `release` branch off of `develop`
* Tag the release with a version number, merge `release` to `main`, remove the `release` branch

## Submitting Issues or Feature Ideas

We'd love to hear your feedback! 

When reporting a bug:

* Write specifically what browser (type and version, like "Firefox 49.0"), OS,
and browser extensions you have installed
* Write steps to replicate the error: when did it happen? What did you expect to happen?
What happened instead?
* We love screenshots.  If you can take a picture of the issue, that is extra helpful.
You can attach the image file onto the GitHub issue and it will be included with your bug report.
* You can use a program like [LICEcap](http://www.cockos.com/licecap/) to record an animated gif.
* When in doubt, over-describe the bug and how you discovered it.

When requesting a feature:

* Provide a link if the feature is available in some other software.
* Pathways is focused on accessibility and inter-operability, so some features (even cool ones!) might not be possible. 

## Editing Presets

Unlike iD Editor, Pathways defines all presets and fields locally. Presets and their associated tags currently represent only the objects found in the official GTFS-Pathways spec, but future development may extend this. To better understand how to update these, some basic definitions:

*Tag:* key-value pair that provides information about a given feature. Tags are what differentiate different types of points or lines from each other (e.g. what makes a line a stairway instead of an escalator). Tags can be entered manually by a user or automatically applied via a preset.

*Preset:* internally, this represents a set of tags that should be attached to a feature to represent it in GTFS-Pathways. For example, a pedestrian walkway is represented as `"pathway_mode":"1"`. Selecting the `walkway` preset applies this information to the feature. 

*Fields:* User-defined data to describe the feature. Once entered, these become `tags`. Required information is added as a `field` (e.g. `stop_name`) and optional information is under `moreFields` (e.g. `min_width`). Tags should only be considered required if validation will not work without the data.

NOTE: This naming is confusing because the `tags` in the editor map to what are called `fields` in the GTFS schema. 

### Expanding Presets and Fields

* New presets can be added by editing [/data/pathwaysPresets.json](/data/pathwaysPresets.json).
* New fields should be added to [/data/pathwaysFields.json](/data/pathwaysFields.json) before adding to a preset.
* To find more details about the schema, please check out ideditor's [schema-builder](https://github.com/ideditor/schema-builder?tab=readme-ov-file#presets).

## (Following sections borrowed from iD Editor - placeholder)
## Translating 

Translations are managed using the
[Transifex](https://www.transifex.com/openstreetmap/id-editor/) platform. After
signing up, you can go to [iD's project
page](https://www.transifex.com/openstreetmap/id-editor/), select a language and
click **Translate** to start translating. Translations are divided into
separate resources:

* *core* - contains text for the main interface of iD
* *presets* - contains the text for labeling feature presets
* *imagery* - contains text for imagery names and descriptions

The words in brackets, for example `{name}`, should not be translated into a
new language: it's replaced with a place name when iD presents the text. So a
French translation of `Couldn't locate a place named '{name}'` would look like
`Impossible de localiser l'endroit nommé '{name}'`.

The translations for presets, [maintained in the id-tagging-schema repository](https://github.com/openstreetmap/id-tagging-schema), consist of the names of presets, labels for
preset fields, and lists of search terms. You do _not_ need to translate the
search terms literally -- use a set of synonyms and related terms appropriate
to the target language, separated by commas.
For more information on translating the presets [please see this id-tagging-schema contribution guide](https://github.com/openstreetmap/id-tagging-schema/blob/main/CONTRIBUTING.md#translating). 

You can check your translations on the [development preview site](https://ideditor.netlify.app),
which is updated every time we change the `develop` branch.

[iD translation project on Transifex](https://www.transifex.com/openstreetmap/id-editor/)

To get notifications when translation source files change, click **Watch
project** button near the bottom of the project page. You can edit your
[notification settings](https://www.transifex.com/user/settings/notices/) if you're
getting too many notifications.

Translations are licensed under
[ISC](https://raw.github.com/openstreetmap/iD/develop/LICENSE.md), the same license
as iD.



### Translations in Code

iD translates strings with a `t` function: `t('foo.bar')` translates the key
`foo.bar` into the current language. If you introduce new translatable strings,
only display them in the interface through the `t()` function.

Then, add the new string to `data/core.yaml`. The translation system, Transifex,
will automatically detect the change.

If you are updating an existing string, update it in `data/core.yaml` and run
`npm run build` to generate the `en.json` file automatically, then commit both
modified files.

Use `npm run build` to build the translations with the local changes.

`npm run translations` can be used to pull the latest translations from Transifex.


## Contributing Documentation

Documentation is maintained as a series of [Markdown](http://daringfireball.net/projects/markdown/)
documents in [core.yaml](/data/core.yaml). The documentation
is in the `help` section. The first line
of each new section of documentation should be of the form

```markdown
# GPS
```

This will be used for navigation and as its title in iD. To add a new piece
of documentation, simply add to [/data/core.yaml](/data/core.yaml) in the
same format as the rest, include your new corresponding `docKey` in
[/modules/ui/help.js](/modules/ui/help.js) and call `npm run build`.


## Coding Style

The following information is taken from iD Editor's style guide, as we've chosen to maintain their style and testing procedures:

### JavaScript

iD code was initially written with ES5 syntax, however we do now develop using ES6 syntax.

We mostly follow the Airbnb style guide for JavaScript:
- [Modern ES6](https://github.com/airbnb/javascript)
- [Legacy ES5](https://github.com/airbnb/javascript/tree/es5-deprecated/es5)

We ask that you follow the convention of using 4 space indent in ES5 files and 2 space indent in ES6 files. While the indenting doesn't matter to the compiler, it does make it easier for us humans to see at a glance whether a file has been "upgraded" to ES6.

Always spaces, never tabs.

JavaScript code should pass through [ESLint](http://eslint.org/) with no warnings.


### HTML

There isn't much HTML in iD, but what there is is similar to JavaScript: 4 spaces
always, indented by the level of the tree:

```html
<div>
    <div></div>
</div>
```


### CSS

Just like HTML and JavaScript, 4 space soft tabs always.

```css
.menu-tooltip {
    background: rgba(255, 255, 255, 0.8);
}
```

We write vanilla CSS with no preprocessing step. Since iD targets modern browsers,
(Chrome, Firefox, Safari, Opera, and Edge) feel free to use newer features wisely.


### Tests

Test your code and make sure it passes.

1. Go to the directory where you have checked out `iD`
2. run `npm install`
3. run `npm test` to see whether your tests pass or fail.

Note that in order to run the tests, Chrome needs to be installed on the system. Chromium can be used as an alternative, but requires setting the environment variable `CHROME_BIN` to the corresponding executable (e.g. `export CHROME_BIN="`which chromium`"`).

### Building / Installing

Follow the steps in the [how to get started guide](https://github.com/openstreetmap/iD/wiki/How-to-get-started#build-and-test-instructions) on how to build and run iD.


### Licensing

iD is available under the [ISC License](https://opensource.org/licenses/ISC).
Some of the libraries it uses are under different licenses. If you're contributing
to iD, you're contributing ISC Licensed code.


## Submitting Changes

In your local copy, make a branch for this change using a descriptive branch name:

    git checkout -b fix-the-thing

Make your changes to source files under `modules/`.
The `iD.js` and `iD.min.js` files in this project are autogenerated - don't edit them.

1. Try your change locally.  Run `npm start` and visit `http://127.0.0.1:8080` in a browser.
2. Run lint and tests with `npm test`.
3. If you feel like it, append a line describing your changes to the project's [changelog](https://github.com/openstreetmap/iD/blob/develop/CHANGELOG.md).
4. Commit your changes with an informative commit message.
5. [Submit a pull request](https://help.github.com/articles/using-pull-requests) to the `openstreetmap/iD` project.


## Using GitHub and git

If you are new to GitHub or git you can read the [GitHub Guides](https://guides.github.com)
"Understanding the GitHub Flow", "Git Handbook" and "Forking Projects" could be especially interesting to you.

### Step by Step

Additionally here is a step-by-step workflow example for beginners:

1. [Login](https://github.com/login) to your GitHub account or [create](https://services.github.com/on-demand/intro-to-github/create-github-account) a GitHub account, if you do not already have one.

2. Go to the [iD main repository](https://github.com/openstreetmap/iD) and fork iD into your GitHub account (Fork is top right).

3. Set up [Git](https://help.github.com/articles/set-up-git/) and prepare for Authenticating with GitHub from Git.

4. Clone or download your local copy of iD from your GitHub account using https `git clone https://github.com/<yourgithubaccount>/iD.git` or using ssh `git clone git@github.com:{{yourgithubaccount}}/iD.git`. In your local copy you'll have a "remote" called origin.

5. Switch to the iD directory, create a working branch (choose a descriptive name) and switch to it : `cd iD ; git checkout -b <working-branch-name>`. Never do anything in the `develop` branch.

6. Edit file(s) and try your change locally (See above).

7. Add Files and commit them `git add <files> ; git commit -m "Description of what you did"` .. repeat as needed ..

8. Push Changes to your GitHub account `git push origin <working-branch-name>`. The next push also works without the branch name: `git push origin`.

9.  Go to GitHub for your fork of iD at https://github.com/{{yourgithubaccount}}/iD. GitHub will already know about your recently pushed branch, and ask if you want to create a Pull Request for it.

10. Your Pull Request will be seen by the maintainers of iD. They can merge it or ask for changes. You can update your Pull Request with Steps 7 and 8, Step 9 is required only once per Pull Request.

### Clean Up

After your Pull Request gets merged into the main repository
you can clean up by deleting the branch from your GitHub-iD-Clone and your local directory

`git push --delete origin <working-branch-name> ; git branch -d <working-branch-name>`

### Restart with another PR after some while

If you did not use your copy of iD for some while, other Pull Request gets merged and you don't have the latest version of iD. You can replace your `develop` with whatever is in our `develop`. If you have not done so yet: Add the main repo as an "upstream" remote:

`git remote add upstream git@github.com:openstreetmap/iD.git`

Then change to the `develop` branch and get everything from upstream (the main repository)

`git checkout develop ; git fetch --all && git reset --hard upstream/develop`


## Submitting directly in the Browser

If you want to submit Documentation, Spelling improvements, etc. which do not need testing,
you can do this with your browser in GitHub. Please don't use this to change Code and create untested Pull Requests.
You also need a GitHub account and may find this [Article about Editing](https://help.github.com/articles/editing-files-in-another-user-s-repository/) and this [Article about Pull Requests](https://help.github.com/articles/about-pull-requests/) useful.

### Step by Step with Browser

Additionally here is a step-by-step workflow example for beginners:

1. [Login](https://github.com/login) to your GitHub account or [create](https://services.github.com/on-demand/intro-to-github/create-github-account) a GitHub account, if you do not already have one.

2. Go to the [iD main repository](https://github.com/openstreetmap/iD) and fork iD into your GitHub account (Fork is top right).

3. Create a New Branch by clicking on "Branch: develop" and entering the name of a new branch (choose a descriptive name).

4. Navigate to the file you want to edit and click on "Edit this file" and apply your changes to the file. Alternatively, you could also "Create a new file".

5. When finished editing the file enter a commit text (the description is optional) and commit directly to the newly created branch. You may repeat 4 and 5 until all required changes are committed.

6. Navigate back to your "id" project - https://github.com/{{yourgithubaccount}}/iD

7. Follow this [Article about Pull Requests](https://help.github.com/articles/about-pull-requests/) to create a new pull request for your change
