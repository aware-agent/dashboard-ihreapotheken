import { Card, CardContent } from '@/components/ui/card';

interface DefinitionCardProps {
  title: string;
  description: string;
  image?: string | null;
  imageAlt?: string;
}

export function DefinitionCard({ title, description, image, imageAlt }: DefinitionCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-6">
          {image && (
            <img
              src={image}
              alt={imageAlt || title}
              className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <h2 className="title-md text-foreground mb-2">{title}</h2>
            <p className="body-md text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
