import { Package } from "@/types/results";

export function getPackageName(code: string, packages: Package[]): string {
    const foundPackage = packages.find((p) => p.packageCode === code);
    return foundPackage?.packageName ?? code;
}
