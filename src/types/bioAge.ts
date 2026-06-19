export interface BioAge {
  resultId: string,
  yearsOld: number,
  ageAtBloodDraw: number,
  bioAge: number,
  ageAcceleration: number,
  ageAccelerationPercentage: number,
  dateOfBloodDraw: string,
  breakDown: Record<string, number>

}

export interface BioAgeData {
  bioAge: BioAge;
}

export interface BioAgeHistory {
  bioAgeProgress: BioAge[];
}
