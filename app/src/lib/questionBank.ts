// A small static MCQ bank used to build ONLINE mock tests in the demo seed.
// Keyed by subject code (see lib/seed.ts subjectDefs). Single-correct questions.

export interface BankQuestion {
  text: string
  options: string[]
  correct: number
}

export const QUESTION_BANK: Record<string, BankQuestion[]> = {
  PHY: [
    { text: 'A body moves with uniform acceleration. Its velocity–time graph is a', options: ['straight line', 'parabola', 'hyperbola', 'circle'], correct: 0 },
    { text: 'The SI unit of electric field is', options: ['N/C', 'C/N', 'J/C', 'V·m'], correct: 0 },
    { text: 'Escape velocity from the Earth is approximately', options: ['7.9 km/s', '11.2 km/s', '9.8 km/s', '15 km/s'], correct: 1 },
    { text: 'A convex lens forms a real, inverted, same-size image when the object is at', options: ['focus', '2F', 'between F and 2F', 'infinity'], correct: 1 },
    { text: 'Work done by a centripetal force on a body in circular motion is', options: ['positive', 'negative', 'zero', 'infinite'], correct: 2 },
    { text: 'Dimensional formula of pressure is', options: ['[ML⁻¹T⁻²]', '[MLT⁻²]', '[ML²T⁻²]', '[ML⁻²T⁻²]'], correct: 0 },
    { text: 'Two resistors of 3 Ω and 6 Ω in parallel give an equivalent resistance of', options: ['9 Ω', '2 Ω', '4.5 Ω', '18 Ω'], correct: 1 },
    { text: 'The photoelectric effect is best explained by', options: ["Newton's corpuscular theory", "Huygens' wave theory", "Einstein's photon theory", "Maxwell's equations"], correct: 2 },
    { text: 'If momentum is doubled, kinetic energy becomes', options: ['half', 'double', 'four times', 'unchanged'], correct: 2 },
    { text: 'The moment of inertia of a solid sphere about a diameter is', options: ['(2/5)MR²', '(2/3)MR²', 'MR²', '(1/2)MR²'], correct: 0 },
  ],
  CHE: [
    { text: 'The number of moles in 44 g of CO₂ is', options: ['0.5', '1', '2', '4'], correct: 1 },
    { text: 'Which has the highest first ionisation enthalpy?', options: ['Na', 'Mg', 'Al', 'Si'], correct: 3 },
    { text: 'The hybridisation of carbon in methane (CH₄) is', options: ['sp', 'sp²', 'sp³', 'sp³d'], correct: 2 },
    { text: 'pH of a 0.01 M HCl solution is', options: ['1', '2', '12', '7'], correct: 1 },
    { text: 'Which is a strong electrolyte?', options: ['CH₃COOH', 'NH₄OH', 'NaCl', 'H₂CO₃'], correct: 2 },
    { text: 'The oxidation state of Mn in KMnO₄ is', options: ['+2', '+4', '+6', '+7'], correct: 3 },
    { text: 'Isotopes differ in the number of', options: ['protons', 'electrons', 'neutrons', 'valence electrons'], correct: 2 },
    { text: 'The general formula of alkanes is', options: ['CₙH₂ₙ', 'CₙH₂ₙ₊₂', 'CₙH₂ₙ₋₂', 'CₙHₙ'], correct: 1 },
    { text: 'Which gas is released when a metal reacts with a dilute acid?', options: ['Oxygen', 'Hydrogen', 'Carbon dioxide', 'Chlorine'], correct: 1 },
    { text: 'Bleaching powder is chemically', options: ['CaOCl₂', 'CaCO₃', 'Ca(OH)₂', 'CaSO₄'], correct: 0 },
  ],
  MAT: [
    { text: 'The value of sin 30° + cos 60° is', options: ['0', '1', '1/2', '√3/2'], correct: 1 },
    { text: 'If the roots of x² − 5x + 6 = 0 are α and β, then α + β equals', options: ['5', '6', '−5', '1'], correct: 0 },
    { text: 'The derivative of x³ with respect to x is', options: ['3x', '3x²', 'x²/3', 'x⁴/4'], correct: 1 },
    { text: 'The number of diagonals in a hexagon is', options: ['6', '9', '12', '15'], correct: 1 },
    { text: '∫ 1/x dx equals', options: ['x²/2 + C', 'ln|x| + C', '−1/x² + C', '1 + C'], correct: 1 },
    { text: 'The probability of getting a sum of 7 with two dice is', options: ['1/6', '1/12', '5/36', '1/9'], correct: 0 },
    { text: 'If A is a 3×3 matrix and det(A) = 2, then det(2A) is', options: ['4', '8', '16', '2'], correct: 2 },
    { text: 'The distance between points (0,0) and (3,4) is', options: ['5', '7', '1', '25'], correct: 0 },
    { text: 'The 10th term of the AP 2, 5, 8, … is', options: ['26', '29', '32', '23'], correct: 1 },
    { text: 'log₂ 32 equals', options: ['4', '5', '6', '16'], correct: 1 },
  ],
  BIO: [
    { text: 'The powerhouse of the cell is the', options: ['nucleus', 'ribosome', 'mitochondrion', 'Golgi body'], correct: 2 },
    { text: 'Which blood cells are involved in clotting?', options: ['RBCs', 'Platelets', 'Lymphocytes', 'Monocytes'], correct: 1 },
    { text: 'The functional unit of the kidney is the', options: ['neuron', 'nephron', 'alveolus', 'villus'], correct: 1 },
    { text: 'Photosynthesis mainly occurs in the', options: ['mitochondria', 'chloroplast', 'nucleus', 'vacuole'], correct: 1 },
    { text: 'Insulin is secreted by which organ?', options: ['Liver', 'Pancreas', 'Kidney', 'Thyroid'], correct: 1 },
    { text: 'The number of chambers in a human heart is', options: ['2', '3', '4', '1'], correct: 2 },
    { text: 'DNA replication is', options: ['conservative', 'semi-conservative', 'dispersive', 'random'], correct: 1 },
    { text: 'Which vitamin is synthesised in the skin in sunlight?', options: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K'], correct: 2 },
    { text: 'Genes are made up of', options: ['proteins', 'lipids', 'DNA', 'carbohydrates'], correct: 2 },
    { text: 'The largest gland in the human body is the', options: ['pancreas', 'liver', 'thyroid', 'salivary gland'], correct: 1 },
  ],
  QA: [
    { text: 'A train 120 m long crosses a pole in 6 s. Its speed is', options: ['72 km/h', '60 km/h', '20 km/h', '36 km/h'], correct: 0 },
    { text: 'The average of the first 10 natural numbers is', options: ['5', '5.5', '6', '10'], correct: 1 },
    { text: 'If 25% of a number is 60, the number is', options: ['180', '240', '120', '300'], correct: 1 },
    { text: 'A sum doubles in 5 years at simple interest. The rate per annum is', options: ['10%', '15%', '20%', '25%'], correct: 2 },
    { text: 'The ratio 0.75 : 1.25 in simplest form is', options: ['3 : 5', '5 : 3', '2 : 3', '3 : 4'], correct: 0 },
    { text: 'The compound interest on ₹1000 at 10% p.a. for 2 years is', options: ['₹200', '₹210', '₹100', '₹221'], correct: 1 },
    { text: 'A can do a job in 12 days, B in 6 days. Together they take', options: ['3 days', '4 days', '9 days', '18 days'], correct: 1 },
    { text: 'The next number in 2, 6, 12, 20, 30, … is', options: ['36', '40', '42', '44'], correct: 2 },
  ],
  LR: [
    { text: 'Find the odd one out: 3, 5, 11, 14, 17, 21', options: ['14', '11', '17', '21'], correct: 0 },
    { text: 'If FRIEND is coded as HUMJTK, then CANDLE is coded as', options: ['EDRIRL', 'DCoEMF', 'ECPFNG', 'None'], correct: 2 },
    { text: 'Pointing to a photo, a man said, "She is the daughter of my grandfather\'s only son." How is she related to him?', options: ['Sister', 'Daughter', 'Mother', 'Cousin'], correct: 0 },
    { text: 'Complete the series: Z, X, V, T, ?', options: ['R', 'S', 'Q', 'P'], correct: 0 },
    { text: 'If A = 1, B = 2, …, then the sum of the letters of "CAB" is', options: ['5', '6', '7', '8'], correct: 1 },
    { text: 'Which figure comes next: △ ▽ △ ▽ ?', options: ['△', '▽', '□', '○'], correct: 0 },
    { text: 'A is taller than B, C is shorter than A. Who is the tallest?', options: ['A', 'B', 'C', 'Cannot say'], correct: 0 },
    { text: 'Statements: All pens are books. All books are red. Conclusion: All pens are red.', options: ['True', 'False', 'Cannot be determined', 'Partially true'], correct: 0 },
  ],
  GA: [
    { text: 'The capital of Australia is', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correct: 2 },
    { text: 'The Indian Constitution came into effect on', options: ['15 Aug 1947', '26 Jan 1950', '26 Nov 1949', '2 Oct 1950'], correct: 1 },
    { text: 'The currency of Japan is the', options: ['Won', 'Yuan', 'Yen', 'Ringgit'], correct: 2 },
    { text: 'The largest planet in the Solar System is', options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], correct: 1 },
    { text: 'The headquarters of the WHO is in', options: ['New York', 'Geneva', 'Paris', 'Vienna'], correct: 1 },
    { text: 'The "Father of the Nation" of India is', options: ['Nehru', 'Gandhi', 'Patel', 'Bose'], correct: 1 },
    { text: 'RBI was established in the year', options: ['1935', '1947', '1950', '1969'], correct: 0 },
    { text: 'The longest river in the world is the', options: ['Amazon', 'Nile', 'Ganga', 'Yangtze'], correct: 1 },
  ],
  ENG: [
    { text: 'Choose the correct synonym of "abundant"', options: ['scarce', 'plentiful', 'weak', 'hidden'], correct: 1 },
    { text: 'Fill in the blank: She has been living here ___ 2015.', options: ['for', 'since', 'from', 'at'], correct: 1 },
    { text: 'The antonym of "transparent" is', options: ['clear', 'opaque', 'bright', 'thin'], correct: 1 },
    { text: 'Identify the error: "He don\'t like coffee."', options: ['He', "don't", 'like', 'coffee'], correct: 1 },
    { text: 'Choose the correctly spelt word', options: ['recieve', 'receive', 'receeve', 'recceive'], correct: 1 },
    { text: 'The plural of "phenomenon" is', options: ['phenomenons', 'phenomena', 'phenomenae', 'phenomenon'], correct: 1 },
    { text: '"A piece of cake" means', options: ['something sweet', 'something very easy', 'a small portion', 'a celebration'], correct: 1 },
    { text: 'Passive voice of "They built a house" is', options: ['A house is built by them', 'A house was built by them', 'A house has built', 'They were building a house'], correct: 1 },
  ],
  SCI: [
    { text: 'The chemical symbol for gold is', options: ['Go', 'Gd', 'Au', 'Ag'], correct: 2 },
    { text: 'Sound cannot travel through', options: ['solids', 'liquids', 'gases', 'vacuum'], correct: 3 },
    { text: 'The most abundant gas in the atmosphere is', options: ['oxygen', 'carbon dioxide', 'nitrogen', 'argon'], correct: 2 },
    { text: 'Rusting of iron requires', options: ['only air', 'only water', 'air and water', 'neither'], correct: 2 },
    { text: 'The unit of force is the', options: ['joule', 'newton', 'watt', 'pascal'], correct: 1 },
    { text: 'Plants make food through the process of', options: ['respiration', 'transpiration', 'photosynthesis', 'digestion'], correct: 2 },
    { text: 'A solar eclipse occurs when', options: ['the Moon is between the Sun and Earth', 'the Earth is between the Sun and Moon', 'the Sun is between the Earth and Moon', 'never'], correct: 0 },
    { text: 'The pH of pure water at 25°C is', options: ['0', '7', '14', '1'], correct: 1 },
  ],
  SST: [
    { text: 'The Quit India Movement was launched in the year', options: ['1930', '1942', '1947', '1919'], correct: 1 },
    { text: 'The Tropic of Cancer does NOT pass through', options: ['Rajasthan', 'Gujarat', 'Kerala', 'Madhya Pradesh'], correct: 2 },
    { text: 'The Lok Sabha has a maximum strength of', options: ['250', '545', '552', '600'], correct: 2 },
    { text: 'The Harappan civilisation belonged to the', options: ['Stone Age', 'Bronze Age', 'Iron Age', 'Modern Age'], correct: 1 },
    { text: 'Which soil is best for cotton cultivation?', options: ['Alluvial', 'Black', 'Red', 'Laterite'], correct: 1 },
    { text: 'The Preamble to the Indian Constitution begins with', options: ['"We, the people of India"', '"India, that is Bharat"', '"Sovereign socialist"', '"Justice, liberty"'], correct: 0 },
  ],
  SPK: [
    { text: 'Which is a polite way to ask for help?', options: ['"Give me that."', '"Could you please help me?"', '"Help now."', '"You must help."'], correct: 1 },
    { text: 'The correct response to "How do you do?" is', options: ['"I am fine, thanks."', '"How do you do?"', '"Nothing much."', '"Good night."'], correct: 1 },
    { text: 'Choose the correct question form', options: ['"You are coming?"', '"Are you coming?"', '"Coming you are?"', '"You coming are?"'], correct: 1 },
    { text: 'A synonym for "happy" is', options: ['glad', 'sad', 'angry', 'tired'], correct: 0 },
    { text: 'Which sentence is in the present continuous tense?', options: ['I eat lunch.', 'I am eating lunch.', 'I ate lunch.', 'I will eat lunch.'], correct: 1 },
    { text: 'The past tense of "go" is', options: ['goed', 'gone', 'went', 'going'], correct: 2 },
  ],
}

export function bankFor(code: string): BankQuestion[] {
  return QUESTION_BANK[code] ?? QUESTION_BANK.GA
}
