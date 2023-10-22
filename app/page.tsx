import { prisma } from "@/lib/prisma";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default async function Home() {
  const jobs = await prisma.jobs.findMany({
    where: {
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 2)),
      },
    },
  });
  return (
    <div className="flex flex-col gap-4 max-w-4xl m-auto p-4">
      <h1 className="text-5xl font-bold text-center mb-4">
        Remote Jobs Finder 🔍
      </h1>
      <ul className="flex flex-col gap-2">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link href={job.url}>
              <Card className="hover:bg-muted/50">
                <CardHeader className="flex flex-row gap-4">
                  <div>
                    <Avatar>
                      <AvatarFallback>{job.company[0]}</AvatarFallback>
                      {job.logo ? (
                        <AvatarImage src={job.logo} alt={job.company} />
                      ) : null}
                    </Avatar>
                  </div>
                  <div className="flex flex-col gap-2">
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>
                      {job.company} - {job.salary}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
