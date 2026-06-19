import { useState } from "react";
import * as XLSX from "xlsx";
import { en, de } from "@/locales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Search, CheckCircle, AlertCircle, Download } from "lucide-react";

interface FlattenedTranslation {
  key: string;
  en: string;
  de: string;
  category: string;
}

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else if (typeof value === "string") {
      result[newKey] = value;
    }
  }
  
  return result;
}

function getAllTranslations(): FlattenedTranslation[] {
  const enFlat = flattenObject(en as Record<string, unknown>);
  const deFlat = flattenObject(de as Record<string, unknown>);
  
  const allKeys = new Set([...Object.keys(enFlat), ...Object.keys(deFlat)]);
  
  return Array.from(allKeys).map((key) => ({
    key,
    en: enFlat[key] || "",
    de: deFlat[key] || "",
    category: key.split(".")[0],
  })).sort((a, b) => a.key.localeCompare(b.key));
}

function getTranslationStatus(item: FlattenedTranslation): 'missing' | 'identical' | 'ok' {
  if (!item.en || !item.de) return 'missing';
  if (item.en === item.de) return 'identical';
  return 'ok';
}

function exportToExcel(translations: FlattenedTranslation[]) {
  // Calculate stats
  const totalKeys = translations.length;
  const missingEnKeys = translations.filter((item) => !item.en).length;
  const missingDeKeys = translations.filter((item) => !item.de).length;
  const identicalKeys = translations.filter((item) => item.en === item.de && item.en !== "").length;
  const okKeys = totalKeys - missingEnKeys - missingDeKeys - identicalKeys;

  // Summary sheet data
  const summaryData = [
    ["Localization Summary Report"],
    ["Generated", new Date().toISOString()],
    [],
    ["Metric", "Count"],
    ["Total Keys", totalKeys],
    ["Missing English", missingEnKeys],
    ["Missing German", missingDeKeys],
    ["Identical Values", identicalKeys],
    ["Complete & Different", okKeys],
  ];

  // Translations sheet data
  const translationsData = [
    ["Key", "Category", "English", "German", "Status"],
    ...translations.map((item) => [
      item.key,
      item.category,
      item.en,
      item.de,
      getTranslationStatus(item),
    ]),
  ];

  // Create workbook with two sheets
  const workbook = XLSX.utils.book_new();
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  
  const translationsSheet = XLSX.utils.aoa_to_sheet(translationsData);
  // Set column widths
  translationsSheet["!cols"] = [
    { wch: 40 }, // Key
    { wch: 15 }, // Category
    { wch: 50 }, // English
    { wch: 50 }, // German
    { wch: 12 }, // Status
  ];
  XLSX.utils.book_append_sheet(workbook, translationsSheet, "Translations");

  // Generate filename with date
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `translations-${dateStr}.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, filename);
}

function TranslationRow({ item }: { item: FlattenedTranslation }) {
  const isMissing = !item.en || !item.de;
  const isIdentical = item.en === item.de && item.en !== "";
  
  return (
    <div className={`grid grid-cols-[1fr_1fr_1fr] gap-4 p-3 border-b border-border/50 hover:bg-muted/30 transition-colors ${isMissing ? "bg-destructive/5" : ""}`}>
      <div className="flex items-start gap-2">
        <code className="text-xs text-muted-foreground break-all font-mono">{item.key}</code>
        {isMissing && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
        {isIdentical && <Badge variant="outline" className="text-[10px] shrink-0">Same</Badge>}
      </div>
      <div className={`text-sm ${!item.en ? "text-destructive italic" : ""}`}>
        {item.en || "⚠️ Missing"}
      </div>
      <div className={`text-sm ${!item.de ? "text-destructive italic" : ""}`}>
        {item.de || "⚠️ Missing"}
      </div>
    </div>
  );
}

function CategorySection({ category, items, defaultOpen = false }: { category: string; items: FlattenedTranslation[]; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const missingCount = items.filter((item) => !item.en || !item.de).length;
  const identicalCount = items.filter((item) => item.en === item.de && item.en !== "").length;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 hover:bg-muted transition-colors rounded-lg mb-2">
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-semibold capitalize">{category}</span>
          <Badge variant="secondary">{items.length} keys</Badge>
          {missingCount > 0 && (
            <Badge variant="destructive">{missingCount} missing</Badge>
          )}
          {identicalCount > 0 && (
            <Badge variant="outline" className="text-amber-600">{identicalCount} identical</Badge>
          )}
          {missingCount === 0 && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 p-3 bg-muted/80 font-medium text-sm border-b">
            <div>Key</div>
            <div>English (EN)</div>
            <div>German (DE)</div>
          </div>
          {items.map((item) => (
            <TranslationRow key={item.key} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function LocalizationTest() {
  const [searchQuery, setSearchQuery] = useState("");
  const allTranslations = getAllTranslations();
  
  // Filter translations based on search
  const filteredTranslations = searchQuery
    ? allTranslations.filter(
        (item) =>
          item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.de.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allTranslations;
  
  // Group by category
  const groupedTranslations = filteredTranslations.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FlattenedTranslation[]>);
  
  // Stats
  const totalKeys = allTranslations.length;
  const missingEnKeys = allTranslations.filter((item) => !item.en).length;
  const missingDeKeys = allTranslations.filter((item) => !item.de).length;
  const identicalKeys = allTranslations.filter((item) => item.en === item.de && item.en !== "").length;
  const categories = Object.keys(groupedTranslations).sort();

  const handleExport = () => {
    exportToExcel(allTranslations);
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Localization Test Page</h1>
            <p className="text-muted-foreground mt-1">
              Compare all translation keys side-by-side in English and German
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {totalKeys} Total Keys
            </Badge>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalKeys}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Missing EN</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${missingEnKeys > 0 ? "text-destructive" : "text-green-500"}`}>
                {missingEnKeys}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Missing DE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${missingDeKeys > 0 ? "text-destructive" : "text-green-500"}`}>
                {missingDeKeys}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Identical Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{identicalKeys}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keys or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Category Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Categories Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const items = groupedTranslations[category];
                const missing = items.filter((item) => !item.en || !item.de).length;
                return (
                  <Badge
                    key={category}
                    variant={missing > 0 ? "destructive" : "secondary"}
                    className="capitalize"
                  >
                    {category}: {items.length}
                    {missing > 0 && ` (${missing} missing)`}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Translations by Category */}
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-2">
            {categories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                items={groupedTranslations[category]}
                defaultOpen={searchQuery !== ""}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
