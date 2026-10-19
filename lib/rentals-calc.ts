export interface RentalTotals {
  diffDays: number;
  durationText: string;
  rentalCharge: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  dailyRate: number;
  transportCharges: number;
}

function parseYMD(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function getMonthsAndExtraDays(start: Date, end: Date): { months: number; remainingDays: number } {
  let months = 0;
  let curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  while (true) {
    const nextMonthDate = new Date(curr.getFullYear(), curr.getMonth() + 1, curr.getDate());
    const cycleEnd = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), nextMonthDate.getDate() - 1);

    if (curr.getDate() === 1) {
      // If cycle starts on the 1st, a full month ends on the last day of current month
      const lastDayOfCurrMonth = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
      if (lastDayOfCurrMonth <= end) {
        months++;
        curr = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
        continue;
      } else {
        break;
      }
    } else {
      if (cycleEnd <= end) {
        months++;
        curr = nextMonthDate;
        continue;
      } else {
        break;
      }
    }
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const remainingDays = curr <= end ? Math.round((end.getTime() - curr.getTime()) / oneDayMs) + 1 : 0;
  return { months, remainingDays };
}

export function calculateRentalTotals(
  startDateStr: string,
  endDateStr: string,
  dailyRateInput: number | string,
  transportChargesInput: number | string = 0,
  rentalType: string = "Monthly",
  gstRateInput: number | string = 18
): RentalTotals {
  const rate = Number(dailyRateInput) || 0;
  const transportCharges = Number(transportChargesInput) || 0;
  const gstRate =
    gstRateInput !== undefined && gstRateInput !== "" && !isNaN(Number(gstRateInput))
      ? Math.max(0, Number(gstRateInput))
      : 18;

  const start = parseYMD(startDateStr);
  const end = parseYMD(endDateStr);

  let inclusiveDays = 1;
  let rentalCharge = 0;
  let durationText = "1 day";

  if (start && end && end >= start) {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    inclusiveDays = Math.max(1, Math.round((endMid - startMid) / oneDayMs) + 1);

    const normalizedType = (rentalType || "Monthly").trim().toLowerCase();

    if (normalizedType === "monthly") {
      const { months, remainingDays } = getMonthsAndExtraDays(start, end);

      if (months > 0) {
        rentalCharge = Math.round(months * rate + (remainingDays / 30) * rate);
        if (remainingDays > 0) {
          durationText = `${months} Mo + ${remainingDays} Day${remainingDays > 1 ? "s" : ""} (${inclusiveDays} days)`;
        } else {
          durationText = `${months} Month${months > 1 ? "s" : ""} (${inclusiveDays} days)`;
        }
      } else {
        // Less than 1 full month:
        // If approx full month (28 to 31 days), treat as 1 month
        if (inclusiveDays >= 28 && inclusiveDays <= 31) {
          rentalCharge = Math.round(rate);
          durationText = `1 Month (${inclusiveDays} days)`;
        } else {
          rentalCharge = Math.round((inclusiveDays / 30) * rate);
          durationText = `${inclusiveDays} day${inclusiveDays > 1 ? "s" : ""}`;
        }
      }
    } else if (normalizedType === "weekly") {
      const fullWeeks = Math.floor(inclusiveDays / 7);
      const remainingDays = inclusiveDays % 7;
      rentalCharge = Math.round(fullWeeks * rate + (remainingDays / 7) * rate);

      if (fullWeeks > 0) {
        if (remainingDays > 0) {
          durationText = `${fullWeeks} Wk + ${remainingDays} Day${remainingDays > 1 ? "s" : ""} (${inclusiveDays} days)`;
        } else {
          durationText = `${fullWeeks} Week${fullWeeks > 1 ? "s" : ""} (${inclusiveDays} days)`;
        }
      } else {
        durationText = `${inclusiveDays} day${inclusiveDays > 1 ? "s" : ""}`;
      }
    } else {
      // Daily
      rentalCharge = Math.round(inclusiveDays * rate);
      durationText = `${inclusiveDays} day${inclusiveDays > 1 ? "s" : ""}`;
    }
  } else {
    rentalCharge = Math.round(rate);
    durationText = "1 day";
  }

  const gstAmount = Math.round(rentalCharge * (gstRate / 100));
  const totalAmount = rentalCharge + gstAmount + transportCharges;

  return {
    diffDays: inclusiveDays,
    durationText,
    rentalCharge,
    gstRate,
    gstAmount,
    totalAmount,
    dailyRate: rate,
    transportCharges,
  };
}
