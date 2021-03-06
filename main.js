//https://docs.google.com/spreadsheets/d/1KFFj0SGfwvdiUNpbirtUFmk7foDsMCAM3cvkpVvo5Xo/edit#gid=0

const defaultKey = "1KFFj0SGfwvdiUNpbirtUFmk7foDsMCAM3cvkpVvo5Xo";
const key = window.location.hash.substr(1) || defaultKey;

window.onload = renderDashboardWithKey(key);

function renderDashboardWithKey(key) {
  return function () {
    Promise.resolve()
      .then(getJsonFromGoogleSheet(key))
      .then(getMessagesFromJson)
      .then(renderDashboard(key, document.body));
  };
}

function renderDashboard(key, rootDiv) {
  return function (messages) {
    setPageTitle(messages);

    rootDiv.appendChild(renderHeader(key)(messages));
    rootDiv.appendChild(renderMainSection(messages));

    return rootDiv;
  };
}

function setPageTitle(messages) {
  const title = getHeaderTitle(messages);
  document.title = title;
}

function renderHeader(key) {
  return function (messages) {
    const rootDiv = document.createElement("header");

    setHeaderBackgroundImage(rootDiv)(messages);

    rootDiv.appendChild(renderHeaderLogo(messages));
    rootDiv.appendChild(renderHeaderTitle(messages));
    rootDiv.appendChild(renderHeaderButton());

    return rootDiv;
  };
}

function setHeaderBackgroundImage(headerDiv) {
  return function (messages) {
    const headerBackgroundImage = getHeaderBackgroundImage(messages);
    headerDiv.style.backgroundImage = "url(" + headerBackgroundImage + ")";
  };
}

function renderHeaderTitle(messages) {
  const headerTitle = getHeaderTitle(messages);
  const title = document.createElement("h1");
  title.innerHTML = headerTitle;
  return title;
}

function renderHeaderLogo(messages) {
  const headerLogo = getHeaderLogo(messages);
  const logo = document.createElement("img");
  logo.src = headerLogo;
  logo.alt = "Dashboard logo";
  return logo;
}

function renderHeaderButton() {
  const subtitle = document.createElement("p");

  subtitle.innerHTML = `
    <a href="${getSpreadsheetUrl(key)}" target="_blank">Editer les données</a>
  `;

  return subtitle;
}

function getSpreadsheetUrl(key) {
  const keyWithoutSheetIndex = key.split("/")[0];
  return (
    "https://docs.google.com/spreadsheets/d/" +
    keyWithoutSheetIndex +
    "/edit#gid=0"
  );
}

function renderMainSection(messages) {
  const rootDiv = document.createElement("main");

  const sectionTypes = getSectionTypes(messages);

  sectionTypes.forEach(function (sectionType) {
    rootDiv.appendChild(renderAllMessagesOfType(sectionType)(messages));
  });

  return rootDiv;
}

function renderAllMessagesOfType(messageType) {
  return function (messages) {
    const rootDiv = document.createElement("div");

    const title = document.createElement("h2");
    title.innerHTML = findTitleForMessageType(messageType)(messages);
    rootDiv.appendChild(title);

    messages
      .filter(keepMessagesOfType(messageType))
      .forEach(renderMessage(rootDiv));

    return rootDiv;

    function findTitleForMessageType(messageType) {
      return function (messages) {
        const titleMessage = messages.find(
          keepMessagesOfType(messageType + ".title")
        );
        if (!titleMessage || !titleMessage.content) return messageType;

        return titleMessage.content;
      };
    }
  };
}

function renderMessage(rootDiv) {
  return function (message) {
    const paragraphText = `
      <div>
        <span>⭐ </span> 
        <span style="white-space: pre-wrap;">${message.content}</span>
      </div>
    `;

    let paragraphUrl = "";
    if (message.url) {
      paragraphUrl = `
        <div>
          🔗 <a href="${message.url}" target="_blank">
            ${message.url}
          </a>
        </div>
      `;
    }

    const messageParagraph = document.createElement("p");
    messageParagraph.innerHTML = `
      ${paragraphText}
      ${paragraphUrl}
    `;

    rootDiv.appendChild(messageParagraph);
  };
}

function getHeaderBackgroundImage(messages) {
  const logoMessage = messages.find(
    keepMessagesOfType("header.backgroundImage")
  );
  if (!logoMessage || !logoMessage.url) return "logo.png";

  return logoMessage.url;
}

function getHeaderLogo(messages) {
  const logoMessage = messages.find(keepMessagesOfType("header.logo"));
  if (!logoMessage || !logoMessage.url) return "logo.png";

  return logoMessage.url;
}

function getHeaderTitle(messages) {
  const titleMessage = messages.find(keepMessagesOfType("header.title"));
  if (!titleMessage || !titleMessage.content) return "[header.title]";

  return titleMessage.content;
}

function keepMessagesOfType(messageType) {
  return function (message) {
    return message.type === messageType;
  };
}

function getSectionTypes(messages) {
  const sectionTitleMessages = messages
    .filter(keepMessagesOfTypeMatching(/\.title$/))
    .filter(reverse(keepMessagesOfType("header.title")));
  const sectionTypes = sectionTitleMessages.map(function (message) {
    return message.type.slice(0, -".title".length);
  });

  return sectionTypes;
}

function keepMessagesOfTypeMatching(regex) {
  return function (message) {
    return regex.test(message.type);
  };
}

function getMessagesFromJson(json) {
  const messages = json.feed.entry.map(function (entry) {
    const message = {
      updated: entry.updated["$t"],
    };

    Object.keys(entry).forEach(function (key) {
      if (/gsx\$/.test(key)) {
        const newKey = key.replace("gsx$", "");
        message[newKey] = entry[key]["$t"];
      }
    });

    return message;
  });

  return messages;
}

function getJsonFromGoogleSheet(key) {
  return function () {
    let url = "https://spreadsheets.google.com/feeds/list/";
    url += key;
    if (!key.includes("/")) {
      url += "/1";
    }
    url += "/public/values?alt=json";

    return fetch(url).then(responseToJson);

    function responseToJson(res) {
      return res.json();
    }
  };
}

function reverse(func) {
  return function () {
    return !func.apply(this, arguments);
  };
}
