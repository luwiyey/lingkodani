
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const modules = [
  { title: "Pagsusuri ng Kaso: Pag-atake ng Leaf Blight", description: "Suriin ang isang tunay na kaso at ang inirekomendang tugon ng AI." },
  { title: "Pag-unawa sa mga Pattern ng Wika sa SMS", description: "Alamin kung paano mas mahusay na bigyang-kahulugan ang mga karaniwang parirala ng magsasaka." },
  { title: "Pagbibigay ng Feedback sa Pagtutuwid ng AI", description: "Paano itama ang mga mungkahi ng AI upang mapabuti ang sistema sa paglipas ng panahon." },
];

export default function TrainingPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Pagsasanay at Feedback para sa AEW</h1>
        <p className="text-muted-foreground">Mga mapagkukunan para sa pagpapabuti ng kasanayan ng mga Agricultural Extension Worker.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
            <Card key={module.title}>
                <CardHeader>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button>Simulan ang Modyul</Button>
                </CardContent>
            </Card>
        ))}
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Form ng Feedback sa AI</CardTitle>
          <CardDescription>
            Nakakita ng maling mungkahi ang AI? Ipaalam sa amin dito.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Ang form para sa pagsusumite ng feedback sa mga tugon ng AI ay malapit nang maging available dito.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    