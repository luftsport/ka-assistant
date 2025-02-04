// ==UserScript==
// @name         KA-Assistant
// @namespace    https://nlf.no/
// @version      2025-02-04
// @description  Make KA a bit nicer
// @author       Thomas Fredriksen
// @match        https://ka.nif.no/*
// @match        https://idrettskurs.nif.no/search/simplesearch*
// @match        https://idrettskurs.nif.no/organisations/organisation/*
// @icon         https://nlf.no/contentassets/0dd488716d13429cb8caeb256ee2c2ec/favicon.ico
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==
/* globals $ */

/*
*******************************************************************************************

                                         ka.nif.no

*******************************************************************************************
*/

/*
----------------------------------------------------
.................COMMON ADJUSTMENTS.................
----------------------------------------------------
*/

const fixMenuAnnoyance = () => {
  $('[data-toggle="sticky-dropdown"]').off();

  $('[data-toggle="sticky-dropdown"]').on("click", function () {
    $(this)
      .parent()
      .siblings()
      .each(function () {
        if ($(this).hasClass("open")) {
          $(this).removeClass("open");
        }
      });
    $(this).parent().toggleClass("open");

    var child = $(this).parent().children(1);
    var li = child[1].firstElementChild;
    var a = li.firstElementChild;
    return false;
  });

  $("[data-toggle='sticky-dropdown'] + ul.dropdown-menu a").each(function () {
    var thisLink = $(this).attr("href");
    $(this).on("click", function () {
      console.log(unsafeWindow.nif.activeLinkLSConst, thisLink);
      unsafeWindow.nif.ls(unsafeWindow.nif.activeLinkLSConst, thisLink);
    });

    var currentlyInLs = unsafeWindow.nif.ls(unsafeWindow.nif.activeLinkLSConst);

    if (thisLink === currentlyInLs) {
      $(this).parents("li.dropdown").toggleClass("open");
      $(this).toggleClass("active");
    }
  });
};

/*
----------------------------------------------------
..................HELPER FUNCTIONS..................
----------------------------------------------------
*/

const showKaaLoader = (id) => {
  document.getElementById("kaa-alerts").insertAdjacentHTML(
    "beforeend",
    `<div id="${id}" class="sk-circle" style="margin: 0; padding-top: 4px; height: 22px; display: inline-block;">
        <div class="sk-circle1 sk-child"></div>
        <div class="sk-circle2 sk-child"></div>
        <div class="sk-circle3 sk-child"></div>
        <div class="sk-circle4 sk-child"></div>
        <div class="sk-circle5 sk-child"></div>
        <div class="sk-circle6 sk-child"></div>
        <div class="sk-circle7 sk-child"></div>
        <div class="sk-circle8 sk-child"></div>
        <div class="sk-circle9 sk-child"></div>
        <div class="sk-circle10 sk-child"></div>
        <div class="sk-circle11 sk-child"></div>
        <div class="sk-circle12 sk-child"></div>
    </div>`
  );
};

const removeKaaLoader = (id) => {
  document.getElementById(id).remove();
};

const extractViewModelFromUrl = (
  url,
  viewModelName,
  onload,
  onerror,
  ontimeout
) => {
  showKaaLoader(`kaaLoading-${viewModelName}`);
  GM_xmlhttpRequest({
    method: "GET",
    url: url,
    withCredentials: true,
    crossDomain: true,
    onload: function (data) {
      try {
        const json = JSON.parse(
          data.responseText
            .split(`Nif.${viewModelName}.create(`)
            .at(1)
            .split(");")
            .at(0)
        );
        onload(json);
      } catch (e) {
        console.error(
          e,
          `Unable to fetch viewModel ${viewModelName} from ${url}`
        );
      }

      removeKaaLoader(`kaaLoading-${viewModelName}`);
    },
    onerror: onerror,
    ontimeout: ontimeout,
  });
};

const appendKaaAlert = (severity, text) => {
  document
    .getElementById("kaa-alerts")
    .insertAdjacentHTML(
      "beforeend",
      `<div class="alert alert-${severity}" style="display: inline-block; padding: 5px; margin-left: 5px; margin-bottom: 0;">${text}</div>`
    );
};

const getSearchParams = () => {
  const in_url = {};
  const search = window.location.search.replace("?", "").split("&");
  for (const parameter of search) {
    const kv = parameter.split("=");
    in_url[kv[0]] = kv[1];
  }
  return in_url;
};

const insertBefore = (newNode, referenceNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode);
};

const insertAfter = (newNode, referenceNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

const extractNlfEmail = (emails) => {
  if (!emails.includes(";")) {
    return emails;
  }

  const emailList = emails.split(";");

  return (
    emailList.filter((email) => email.includes("@nlf.no")).at(0) ?? emailList[0]
  );
};

/*
----------------------------------------------------
...................PAGE FUNCTIONS...................
----------------------------------------------------
*/

/* Medlem */
const kaPerson = (pathname) => {
  const page = pathname.split("/").at(1);
  let personId = pathname.split("/").at(-1);
  if (isNaN(personId)) {
    const params = getSearchParams();
    personId = params.id;
  }

  let containerId = undefined;
  switch (page) {
    case "PersonDetail":
      containerId = "persondetailviewmodel_container";
      break;
    case "PersonMemberDetail":
      containerId = "personmemberdetailviewmodel_container";
      break;
    case "PersonRelation":
      containerId = "personrelationviewmodel_container";
      break;
    case "PersonActivity":
      containerId = "personactivityviewmodel_container";
      break;
    case "PersonProduct":
      containerId = "personproductviewmodel_container";
      break;
    case "PersonLicense":
      containerId = "personlicenseviewmodel_container";
      break;
    case "PersonCompetence":
      containerId = "personcompetenceviewmodel_container";
      break;
    case "PersonInvoice":
      containerId = "personinvoiceviewmodel_container";
      break;
  }

  if (containerId === undefined) {
    return;
  }

  const container = document.getElementById(containerId);
  const viewModel = unsafeWindow.ko.dataFor(container);

  const menu = `<div style="margin-top: 15px; padding-left: 15px;"><a class="btn btn-default" href="https://sa.nif.no/Person/Index/About/${personId}">Åpne i SA</a> <a class="btn btn-default" href="https://nlfadmin.no/member/${personId}">Åpne i Sentralen</a> <a class="btn btn-default" href="https://ka.nif.no/SendInvoice?ids=${personId}">Generer faktura</a><div id="kaa-alerts" style="display: inline-block; padding-left: 10px;"></div></div>`;

  container.children[0].insertAdjacentHTML("afterbegin", menu);

  if (page === "PersonDetail") {
    const yearAge =
      new Date().getFullYear() -
      parseInt(
        viewModel.EditPersonViewModel.BirthDate().split(".").at(2) ?? "1970"
      ) +
      1;

    extractViewModelFromUrl(
      `https://ka.nif.no/PersonCompetence/Index/${personId}`,
      "PersonCompetenceViewModel",
      (competences) => {
        for (const competence of competences.Competences) {
          switch (competence.CompetenceName) {
            case "NLF-PFLY":
              appendKaaAlert("success", "PFLY OK");
              break;
            case "NLF Avinor ID-Kort":
              appendKaaAlert("success", "Avinor ID-kort OK");
              break;
          }
        }
      },
      () => {
        console.error("Failed to get competences");
      },
      () => {
        console.error("Timeout while trying to fetch competences");
      }
    );

    extractViewModelFromUrl(
      `https://ka.nif.no/PersonInvoice/Index/${personId}`,
      "PersonInvoiceViewModel",
      (invoices) => {
        if (
          !invoices.Invoices ||
          invoices.Invoices.filter((i) => i.InvoiceStatusId !== 7).length === 0
        ) {
          appendKaaAlert("danger", "Ingen ukrediterte faktura funnet");
        } else {
          const unpaidInvoices = invoices.Invoices.filter(
            (invoice) => invoice.AmountOutstanding > 0
          );
          if (unpaidInvoices.length > 0) {
            appendKaaAlert("warning", "Har ubetalt faktura");
          } else {
            appendKaaAlert("success", "Alle fakturaer er betalt");
          }
        }
      },
      () => {
        console.error("Failed to get invoices");
      },
      () => {
        console.error("Timeout while trying to fetch invoices");
      }
    );

    extractViewModelFromUrl(
      `https://ka.nif.no/PersonActivity/Index/${personId}`,
      "PersonActivityViewModel",
      (activities) => {
        const clubs =
          activities.MembershipOrgSelectionViewModel
            .FederationClubSelectionViewModel.ExistingClubs;
        const missingBranch = clubs.filter(
          (club) =>
            club.BranchNames.trim() === "" || club.BranchNames.trim() === "-"
        );
        if (missingBranch.length > 0) {
          appendKaaAlert("danger", "Er medlem av klubb uten grentilknytning");
        } else {
          appendKaaAlert("success", "Alle klubber har gyldig grentilknytning");
        }

        const modelClubs = clubs.filter(
          (club) => club.BranchNames.replace("-", "").trim() === "Modellfly"
        );

        if (modelClubs.length > 0) {
          extractViewModelFromUrl(
            `https://ka.nif.no/PersonProduct/Index/${personId}`,
            "PersonProductViewModel",
            (products) => {
              const orgs = products.Categories.filter(
                (c) => c.CategoryName === "Unntak"
              ).at(0).Orgs;
              const checked = clubs.map((club) => ({
                club: club.Name,
                selected: orgs
                  .filter((o) => o.ClubOrgId === club.Id)
                  .at(0)
                  .Details.filter((o) => o.Name === "Modellmedlem")
                  .at(0).Selected,
              }));

              const unchecked = checked.filter((c) => !c.selected);

              if (yearAge >= 26 && yearAge <= 66 && unchecked.length > 0) {
                appendKaaAlert(
                  "danger",
                  "Har ugyldig kombinasjon av modellflymedlemskap og modellmedlem-produkt"
                );
              } else if (
                (yearAge < 26 || yearAge > 66) &&
                unchecked.length === 0
              ) {
                appendKaaAlert(
                  "danger",
                  "Er modellmedlem, men skulle hatt alderskategori"
                );
              } else {
                appendKaaAlert("success", "Modellmedlem OK");
              }
            },
            () => {
              console.error("Failed to get products");
            },
            () => {
              console.error("Timeout while trying to fetch products");
            }
          );
        }
      },
      () => {
        console.error("Failed to get activities");
      },
      () => {
        console.error("Timeout while trying to fetch activities");
      }
    );
  }
};

/* Medlem - Reskontro */
const kaPersonReskontro = () => {
  const invoices = unsafeWindow.nif.personInvoiceViewModel.Invoices();

  for (const invoice of invoices) {
    [...document.getElementsByClassName("centered")].forEach((e) => {
      if (
        [...e.parentElement.getElementsByTagName("td")].at(5).innerText ===
        invoice.Kid()
      ) {
        const button = document.createElement("button");
        button.className = "btn btn-default";
        button.style = "margin-top: 5px;";
        button.innerText = "BPM";
        button.onclick = () => {
          window.open(
            `https://bpm.buypass.no/faktura?invoice=${invoice.Kid()}`
          );
        };
        e.append(button);

        [...e.parentElement.getElementsByTagName("td")]
          .at(5)
          .insertAdjacentHTML(
            "beforeend",
            `<br/><small><i>(NIF ID: ${invoice.Id()})</i></small>`
          );
      }
    });

    if (invoice.AmountOutstanding() > 0) {
      [...document.getElementsByClassName("centered")].forEach((e) => {
        if (
          [...e.parentElement.getElementsByTagName("td")]
            .at(5)
            .innerText.startsWith(invoice.Kid())
        ) {
          const button = document.createElement("button");
          button.className = "btn btn-default";
          button.style = "margin-top: 5px;";
          button.innerText = "Krediter";
          button.onclick = () => {
            console.log(`Setting invoice to ${invoice.Id()}`);
            GM_setValue("KAA-CreditReturn", window.location.pathname);
            GM_xmlhttpRequest({
              method: "POST",
              url: "https://ka.nif.no/Invoice/SetSelectedInvoiceIds",
              data: `[${invoice.Id()}]`,
              withCredentials: true,
              crossDomain: true,
              headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9,nb;q=0.8,no;q=0.7",
                "content-type": "application/json",
                "sec-ch-ua":
                  '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-requested-with": "XMLHttpRequest",
              },
              onload: function (data) {
                console.log("Invoice ID set, redirecting");
                location.href = "https://ka.nif.no/CreditInvoice";
              },
              onerror: function () {
                console.error("Failed to set invoice ID");
              },
              ontimeout: function () {
                console.error("Failed to set invoice ID due to timeout");
              },
            });
          };
          e.append(button);
        }
      });

      [...document.getElementsByClassName("centered")].forEach((e) => {
        if (
          [...e.parentElement.getElementsByTagName("td")]
            .at(5)
            .innerText.startsWith(invoice.Kid())
        ) {
          const button = document.createElement("button");
          button.className = "btn btn-default";
          button.style = "margin-top: 5px;";
          button.innerText = "Send kopi";
          button.onclick = () => {
            console.log(`Setting invoice to ${invoice.Id()}`);
            GM_setValue("KAA-SendCopyReturn", window.location.pathname);
            GM_xmlhttpRequest({
              method: "POST",
              url: "https://ka.nif.no/Invoice/SetSelectedInvoiceIds",
              data: `[${invoice.Id()}]`,
              withCredentials: true,
              crossDomain: true,
              headers: {
                accept: "application/json, text/javascript, */*; q=0.01",
                "accept-language": "en-US,en;q=0.9,nb;q=0.8,no;q=0.7",
                "content-type": "application/json",
                "sec-ch-ua":
                  '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-requested-with": "XMLHttpRequest",
              },
              onload: function (data) {
                console.log("Invoice ID set, redirecting");
                location.href = "https://ka.nif.no/SendInvoiceDistribution";
              },
              onerror: function () {
                console.error("Failed to set invoice ID");
              },
              ontimeout: function () {
                console.error("Failed to set invoice ID due to timeout");
              },
            });
          };
          e.append(button);
        }
      });
    }
  }
};

/* Generer faktura */
const kaSendInvoice = () => {
  const viewModel = unsafeWindow.nif.sendInvoiceViewModel;
  const toAddress = viewModel.InvoiceRequest.ToEmailAddress();
  viewModel.InvoiceRequest.ToEmailAddress(extractNlfEmail(toAddress));
  viewModel.InvoiceRequest.SendPdfWithKidAsEmail(true);
  viewModel.selectedProductId(-1);
  viewModel.addFee(-1);
  setTimeout(() => {
    console.log("Removing all 2024 fees");
    viewModel
      .Products()
      .filter((product) => product.Name().toLowerCase().includes("2024"))
      .forEach((product) => viewModel.removeFee(product.OrgId(), product.Id()));
    unsafeWindow.scrollTo(0, document.body.scrollHeight);
  }, 1000);

  const button = document.createElement("button");
  button.className = "btn btn-default";
  button.innerText = "Fjern alt utenom tandemavgifter";
  button.onclick = () => {
    console.log("Removing all non-tandem fees");
    viewModel
      .Products()
      .filter((product) => !product.Name().toLowerCase().includes("tandem"))
      .forEach((product) => viewModel.removeFee(product.OrgId(), product.Id()));
    viewModel.InvoiceRequest.SendPdfWithKidAsEmail(false);
    viewModel.InvoiceRequest.SendEmailAutomatically(false);
  };
  insertBefore(button, document.getElementById("invoiceTextLabel"));

  const button2 = document.createElement("button");
  button2.className = "btn btn-default";
  button2.innerText = "Fjern alt for 2024";
  button2.onclick = () => {
    console.log("Removing all 2024 fees");
    viewModel
      .Products()
      .filter((product) => product.Name().toLowerCase().includes("2024"))
      .forEach((product) => viewModel.removeFee(product.OrgId(), product.Id()));
  };
  insertBefore(button2, document.getElementById("invoiceTextLabel"));

  const button3 = document.createElement("button");
  button3.className = "btn btn-default";
  button3.innerText = "Fjern alt for tandem";
  button3.onclick = () => {
    console.log("Removing all tandem fees");
    viewModel
      .Products()
      .filter((product) => product.Name().toLowerCase().includes("tandem"))
      .forEach((product) => viewModel.removeFee(product.OrgId(), product.Id()));
  };
  insertBefore(button3, document.getElementById("invoiceTextLabel"));
};

/* Krediter faktura */
const kaCreditInvoice = () => {
  const returnUrl = GM_getValue("KAA-CreditReturn", "");

  const viewModel = unsafeWindow.nif.creditInvoiceViewModel;
  const toAddress = viewModel.ToEmailAddress();
  viewModel.ToEmailAddress(extractNlfEmail(toAddress));

  if (returnUrl.length > 0) {
    console.log("Setting return URL", returnUrl);
    viewModel.ReturnUrl(returnUrl);
    GM_setValue("KAA-CreditReturn", "");
  }
};

/* Send fakturakopi */
const kaSendInvoiceDistribution = () => {
  const returnUrl = GM_getValue("KAA-SendCopyReturn", "");

  const viewModel = unsafeWindow.nif.sendInvoiceDistributionViewModel;
  const toAddress = viewModel.NotifyEmail();
  viewModel.NotifyEmail(extractNlfEmail(toAddress));

  if (returnUrl.length > 0) {
    console.log("Setting return URL", returnUrl);
    viewModel.ReturnUrl(returnUrl);
    GM_setValue("KAA-SendCopyReturn", "");
  }
};

/* Send purring */
const kaSendReminder = () => {
  const viewModel = unsafeWindow.nif.sendReminderViewModel;
  const toAddress = viewModel.NotifyEmail();
  viewModel.NotifyEmail(extractNlfEmail(toAddress));
};

/* Varsler */
const kaMessages = () => {
  const containers = [
    "MembershipApplications_container",
    "EndedMemberships_container",
    "DeceasedMembers_container",
  ];

  for (const containerName of containers) {
    const containerElement = document.getElementById(containerName);
    const tbody = [...containerElement.getElementsByTagName("tbody")].at(0);
    if (tbody) {
      const memberRows = [...tbody.getElementsByTagName("tr")];
      for (const memberRow of memberRows) {
        const memberData = unsafeWindow.ko.dataFor(memberRow);
        memberRow.insertAdjacentHTML(
          "beforeend",
          `<td><a href="https://ka.nif.no/PersonDetail/Index/${memberData.PersonId()}" class="btn btn-primary">KA</a> <a href="https://sa.nif.no/Person/Index/About/${memberData.PersonId()}" class="btn btn-primary">SA</a></td>`
        );
      }
    }
  }

  [
    ...document
      .getElementById("handleMembershipApplications")
      .getElementsByTagName("button"),
  ]
    .filter((b) => b.innerText === "Bekreft")
    .at(0)
    .addEventListener("click", () => {
      if (
        unsafeWindow.nif.memberMessagesMembershipApplicationsViewModel.ConfirmationResponse() ===
        "1"
      ) {
        const invoiceAllApproved = [
          ...unsafeWindow.nif.memberMessagesMembershipApplicationsViewModel.Items(),
        ]
          .filter((member) => member.isChecked())
          .map((member) => member.PersonId());
        GM_setValue("KAA-Messages-NewMembers", invoiceAllApproved);
        console.log(`Membership approved for: ${invoiceAllApproved}`);
        document.getElementById(
          "kaa-invoice-link"
        ).href = `https://ka.nif.no/SendInvoice?ids=${invoiceAllApproved.join(
          ","
        )}`;
      }
    });

  const invoiceAll = GM_getValue("KAA-Messages-NewMembers", []);
  if (invoiceAll.length > 0) {
    console.log(`Adding link to generate invoices for: ${invoiceAll}`);
    document
      .getElementById("MembershipApplications_container")
      .insertAdjacentHTML(
        "beforeend",
        `<div class="row"><div class="col-xs-12" style="margin-top: 5px;">
        <a id="kaa-invoice-link" class="btn btn-block btn-primary btn-lg" href="https://ka.nif.no/SendInvoice?ids=${invoiceAll.join(
          ","
        )}">Generer faktura til tidligere behandlede</button>
    </div></div>`
      );
  }
};

/*
*******************************************************************************************

                                     idrettskurs.nif.no

*******************************************************************************************
*/

/*
----------------------------------------------------
..................HELPER FUNCTIONS..................
----------------------------------------------------
*/

// https://www.kevinleary.net/blog/javascript-age-birthdate-mm-dd-yyyy/
const getAge = (birthDate) => {
  const startDate = new Date(new Date(birthDate).toISOString().substr(0, 10));
  const endingDate = new Date().toISOString().substr(0, 10); // YYYY-MM-DD
  let endDate = new Date(endingDate);
  if (startDate > endDate) {
    const swap = startDate;
    startDate = endDate;
    endDate = swap;
  }
  const startYear = startDate.getFullYear();

  // Leap years
  const february =
    (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0
      ? 29
      : 28;
  const daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let yearDiff = endDate.getFullYear() - startYear;
  let monthDiff = endDate.getMonth() - startDate.getMonth();
  let dayDiff = endDate.getDate() - startDate.getDate();

  if (monthDiff < 0) {
    yearDiff--;
    monthDiff += 12;
  }

  if (dayDiff < 0) {
    if (monthDiff > 0) {
      monthDiff--;
    } else {
      yearDiff--;
      monthDiff = 11;
    }
    dayDiff += daysInMonth[startDate.getMonth()];
  }

  return {
    years: yearDiff,
    months: monthDiff,
    days: dayDiff,
  };
};

const getUlMedicalValidity = (age, birthdate) => {
  if (age < 37) {
    return "5 år";
  } else if (age < 40) {
    const maxDate = birthdate.setFullYear(birthdate.getFullYear() + 42);
    return `5 år (men ikke lenger enn ${maxDate})`;
  } else if (age < 50) {
    return "2 år";
  } else {
    return "1 år";
  }
};

/*
----------------------------------------------------
...................PAGE FUNCTIONS...................
----------------------------------------------------
*/

/* Medlem */
const ikOrgPage = () => {
  const personElement = document.getElementById("person");
  if (!personElement) {
    return;
  }

  const observer = new MutationObserver((mutationList, observer) => {
    const birthdateElement = personElement.querySelector(".value.birthdate");

    if (!birthdateElement || birthdateElement.innerText?.trim() === "") {
      return;
    }

    const birthdate = new Date(
      birthdateElement.innerText.split(".").reverse().join("-")
    );
    const age = getAge(birthdate);

    const ulMedicalValidity = getUlMedicalValidity(age.years, birthdate);

    birthdateElement.parentElement.insertAdjacentHTML(
      "afterend",
      `<div class="line">
                <span class="label">Alder:</span>
                <span class="value age">${age.years} år</span>
            </div>
            <div class="line">
                <span class="label">NLF-U-MED:</span>
                <span class="value nlfumed">${ulMedicalValidity}</span>
            </div>`
    );

    observer.disconnect();
  });

  observer.observe(personElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });
};

/* Search */
const ikSearchPage = () => {
  const query = window.location.search.split("&");

  if (query.length === 0 || query.at(0)?.length === 0) {
    return;
  }

  console.log("Found query parameters, injecting");

  for (const queryPart of query) {
    const [param, value] = queryPart.split("=");
    if (param.replace("?", "") === "email") {
      document.querySelector("#email").value = value;
    }
  }

  console.log("Triggering search");

  document.querySelector("#btn_search").click();
};

/*
*******************************************************************************************

                                       SCRIPT ENTRY

*******************************************************************************************
*/

(function () {
  "use strict";

  console.log("Starting KA-Assistant V. " + GM_info.script.version);
  const pathname = window.location.pathname;
  const domain = document.domain;
  const href = window.location.href;

  switch (domain) {
    case "idrettskurs.nif.no":
      console.log("Running within the Idrettskurs domain");

      if (pathname.startsWith("/organisations/organisation/")) {
        ikOrgPage();
      }

      if (pathname.startsWith("/search/simplesearch")) {
        ikSearchPage();
      }
      break;
    case "ka.nif.no":
      console.log("Running within the KA domain");

      if (pathname.startsWith("/Person")) {
        kaPerson(pathname);
      }

      if (pathname.startsWith("/PersonInvoice/Index/")) {
        kaPersonReskontro();
      }

      switch (pathname) {
        case "/SendInvoice":
          kaSendInvoice();
          break;
        case "/CreditInvoice":
          kaCreditInvoice();
          break;
        case "/SendInvoiceDistribution":
          kaSendInvoiceDistribution();
          break;
        case "/SendReminder":
          kaSendReminder();
          break;
        case "/Messages":
          kaMessages();
          break;
      }

      fixMenuAnnoyance();
      break;
  }
})();
