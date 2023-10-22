import pw, { Browser } from "playwright";
import { NextResponse } from "next/server";
import { Jobs } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const SBR_CDP = `wss://${process.env.BRIGHTDATA_AUTH}@brd.superproxy.io:9222`;

export const GET = async (req: Request, res: Response) => {
  const browser = await pw.chromium.connectOverCDP(SBR_CDP);

  const remoteOKJobs = await getRemoteOkJobs(browser);
  const weWorkRemotelyJobs = await getWeWorkRemotelyJobs(browser);

  const jobs = [...remoteOKJobs, ...weWorkRemotelyJobs];

  await prisma.jobs.createMany({
    data: jobs,
  });

  return NextResponse.json({
    jobs,
  });
};

// Scraping for We Work Remotely
const getWeWorkRemotelyJobs = async (instance: Browser) => {
  const page = await instance.newPage();

  await page.goto(
    "https://weworkremotely.com/categories/remote-front-end-programming-jobs#job-listings"
  );

  const jobs = await page.$$eval("article li", (rows) => {
    return rows.map((row) => {
      if (row.classList.contains("ad")) {
        return;
      }

      // ligne
      const obj = {
        title: "",
        company: "",
        date: new Date(),
        logo: "",
        salary: "",
        url: "",
      } satisfies Prisma.JobsCreateManyInput;

      const title = row.querySelector(".title");

      if (title) {
        obj.title = title.textContent?.trim() ?? "";
      }

      const company = row.querySelector(".company");
      if (company) {
        obj.company = company.textContent?.trim() ?? "";
      }

      const divLogo = row.querySelector(".flag-logo") as HTMLDivElement;
      if (divLogo) {
        const backgroundimage = divLogo.style.backgroundImage;
        const img = backgroundimage
          ?.replace("url(", "")
          .replace(")", "")
          .replaceAll('"', "");
        obj.logo = img ?? "";
      }

      const aElement = row.querySelectorAll("a")[1];
      if (aElement) {
        obj.url =
          "https://weworkremotely.com/" + aElement.getAttribute("href") ?? "";
      }

      return obj;
    });
  });
  const jobsFiltered = jobs.filter((job) => {
    if (!job) return false;
    if (!job?.title) return false;
    if (!job?.company) return false;
    if (!job?.url) return false;

    return true;
  }) as Prisma.JobsCreateManyInput[];
  return jobsFiltered;
};

// Scraping for remoteok.com
const getRemoteOkJobs = async (instance: Browser) => {
  const page = await instance.newPage();

  await page.goto("https://remoteok.com/remote-engineer-jobs?order_by=date");

  const jobs = await page.$$eval("tr", (rows) => {
    return rows.map((row) => {
      if (row.classList.contains("ad")) {
        return;
      }

      // ligne
      const obj = {
        title: "",
        company: "",
        date: new Date(),
        logo: "",
        salary: "",
        url: "",
      } satisfies Prisma.JobsCreateManyInput;

      const h2Title = row.querySelector("h2");

      if (h2Title) {
        obj.title = h2Title.textContent?.trim() ?? "";
      }

      const h3Company = row.querySelector("h3");
      if (h3Company) {
        obj.company = h3Company.textContent?.trim() ?? "";
      }

      const hasLogoElement = row.querySelector(".has-logo");
      if (hasLogoElement) {
        const logo = hasLogoElement.querySelector("img");
        if (logo) {
          obj.logo = logo.getAttribute("src") ?? "";
        }
      }

      const url = row.getAttribute("data-url");
      if (url) {
        obj.url = "https://remoteok.com" + url;
      }

      const locationsElements = row.querySelectorAll(".location");
      for (const locationElement of locationsElements) {
        const location = locationElement.textContent?.trim() ?? "";
        if (location.startsWith("💰")) {
          obj.salary = location;
        }
      }

      return obj;
    });
  });
  const jobsFiltered = jobs.filter((job) => {
    if (!job) return false;
    if (!job?.title) return false;
    if (!job?.company) return false;
    if (!job?.url) return false;

    return true;
  }) as Prisma.JobsCreateManyInput[];
  return jobsFiltered;
};
