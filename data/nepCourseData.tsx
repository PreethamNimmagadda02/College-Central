import { TimeTableCourse } from '../types';
import { calculateCreditsFromLTP } from '../utils/creditCalculator';

const courseOption = 'NEP';

function time(timeStr: string) {
    const [start, end] = timeStr.split('-');
    if (!start || !end) {
        return { startTime: '00:00', endTime: '00:00' };
    }
    const parse = (t: string) => {
        const parts = t.trim().split(' ');
        const timePart = parts[0];
        const period = parts[1];
        if (!timePart || !period) {
             return '00:00';
        }
        const [hStr, mStr] = timePart.split(':');
        let h = Number(hStr);
        let m = Number(mStr);
        if (!Number.isFinite(h) || !Number.isFinite(m)) {
            return '00:00';
        }

        if (period.toUpperCase() === 'PM' && h !== 12) {
            h += 12;
        }
        if (period.toUpperCase() === 'AM' && h === 12) { // Midnight case 12 AM is 00 hours
            h = 0;
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return { startTime: parse(start), endTime: parse(end) };
}


export const NEP_TIMETABLE_DATA: TimeTableCourse[] = [
    {
        courseCode: "NEEC101",
        courseName: "Basics of Electrical Engineering - I",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G1" },
            { "day": "Tuesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G1" },
            { "day": "Wednesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NEEC102",
        courseName: "Basics of Electrical Engineering - I Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "Lab" },
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "Lab" }
        ]
    },
    {
        courseCode: "NEEC501",
        courseName: "ADVANCED CONTROL SYSTEM",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C2" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C2" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C2" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C2" }
        ]
    },
    {
        courseCode: "NEEC502",
        courseName: "POWER SYSTEM ANALYSIS",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-I-C13" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-I-C13" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-I-C13" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C13" }
        ]
    },
    {
        courseCode: "NEEC503",
        courseName: "HVDC TRANSMISSION AND FACTS",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C13" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-I-C13" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-I-C13" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C13" }
        ]
    },
    {
        courseCode: "NEED501",
        courseName: "HIGH VOLTAGE ENGINEERING",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C13" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C13" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C13" }
        ]
    },
    {
        courseCode: "NEED503",
        courseName: "POWER SYSTEM DYNAMICS",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C13" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C13" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C13" }
        ]
    },
    {
        courseCode: "NEED504",
        courseName: "POWER QUALITY",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C7" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C7" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C7" }
        ]
    },
    {
        courseCode: "NEEC504",
        courseName: "ADVANCED POWER SYSTEM LAB",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NEEC505",
        courseName: "ADVANCED ELECTRICAL MACHINE LAB",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NEEC506",
        courseName: "ADVANCED CONTROL SYSTEM LAB",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "Lab" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "Lab" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "Lab" }
        ]
    },
    {
        courseCode: "NEEC514",
        courseName: "MODELLING OF ELECTRICAL MACHINES",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C2" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C2" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C2" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C2" }
        ]
    },
    {
        courseCode: "NEEC515",
        courseName: "CONVERTER CONTROLLED MACHINE DRIVES",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C2" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C2" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C2" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C2" }
        ]
    },
    {
        courseCode: "NEED506",
        courseName: "POWER ELECTRONICS FOR RENEWABLE ENERGY SYSTEMS",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C4" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C4" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C4" }
        ]
    },
    {
        courseCode: "NEED507",
        courseName: "WIRELESS POWER TRANSFER",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C2" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C2" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C2" }
        ]
    },
    {
        courseCode: "NEED508",
        courseName: "DESIGN OF POWER CONVERTERS",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C4" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C4" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C4" }
        ]
    },
    {
        courseCode: "NEED509",
        courseName: "ADVANCED MACHINE DRIVES",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C2" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C2" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C2" }
        ]
    },
    {
        courseCode: "NEEC516",
        courseName: "ADVANCED POWER ELECTRONICS LAB",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NEEC201",
        courseName: "Signals, Systems and Networks",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G9" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G9" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G9" }
        ]
    },
    {
        courseCode: "NEEC202",
        courseName: "Analog and Digital Electronics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G9" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G9" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G9" }
        ]
    },
    {
        courseCode: "NEEC203",
        courseName: "Electromagnetic Theory and Applications",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G9" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G9" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G9" }
        ]
    },
    {
        courseCode: "NEEC204",
        courseName: "Networks Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "Lab" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "Lab" }
        ]
    },
    {
        courseCode: "NEEC205",
        courseName: "Analog and Digital Electronics Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NEEE201",
        courseName: "Utilization of Electrical Energy",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G9" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G9" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G9" }
        ]
    },
    {
        courseCode: "NEEE101",
        courseName: "Electrical Devices and Circuits",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G4" },
            { "day": "Thursday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G4" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G4" }
        ]
    },
    {
        courseCode: "NCSC501",
        courseName: "Advanced Data Structures & Algorithms",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "CSE CR1" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "CSE CR1" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "CSE CR1" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "CSE CR1" }
        ]
    },
    {
        courseCode: "NCSC502",
        courseName: "Computing Techniques and Mathematical Tools",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("6:00 PM-6:50 PM"), "venue": "LC-II-G6" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-I-C12" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G6" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G6" }
        ]
    },
    {
        courseCode: "NCSC503",
        courseName: "Advanced Computer Networks",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "CSE CR1" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "CSE CR1" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "CSE CR1" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "CSE CR1" }
        ]
    },
    {
        courseCode: "NCSC101",
        courseName: "Introduction to Unix and Software Tools",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G3" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G3" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G3" }
        ]
    },
    {
        courseCode: "NCSC102",
        courseName: "Introduction to Unix and Software Tools Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "NLHC Computer Lab - II" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "NLHC Computer Lab - II" }
        ]
    },
    {
        courseCode: "NCSV101",
        courseName: "Computer Programming",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G1" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G1" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NCSV102",
        courseName: "Computer Programming Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Tuesday", ...time("8:00 AM-8:50 AM"), "venue": "NLHC Computer Lab - III" },
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "NLHC Computer Lab - III" }
        ]
    },
    {
        courseCode: "NCSD525",
        courseName: "Mobile and Wireless Network Security",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR1" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR1" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR1" }
        ]
    },
    {
        courseCode: "NCSD505",
        courseName: "Image and Video Processing",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "CSE CR1" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR1" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR1" }
        ]
    },
    {
        courseCode: "NCSC504",
        courseName: "Computing Techniques and Mathematical Tools Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "CSE LAB -IV" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "CSE LAB -IV" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "CSE LAB -IV" }
        ]
    },
    {
        courseCode: "NCSC505",
        courseName: "Advanced Data Structures & Algorithms Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "CSE LAB - III" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "CSE LAB - III" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "CSE LAB - III" }
        ]
    },
    {
        courseCode: "NCSC506",
        courseName: "Advanced Computer Network Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "CSE LAB -IV" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "CSE LAB -IV" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "CSE LAB -IV" }
        ]
    },
    {
        courseCode: "NCSC201",
        courseName: "Discrete Mathematicss",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G10" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G10" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NCSC202",
        courseName: "Computer Organization and Architecturee",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G10" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G10" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NCSC203",
        courseName: "Algorithm Design and Analysis",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G10" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G10" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NCSC204",
        courseName: "Computer Organization and Architecture Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "CSE LAB - I" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "CSE LAB - I" }
        ]
    },
    {
        courseCode: "NCSC205",
        courseName: "Algorithm Design and Analysis Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "NLHC Computer Lab - I" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "NLHC Computer Lab - III" }
        ]
    },
    {
        courseCode: "NCSE201",
        courseName: "Computer Programming with C++",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G10" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G10" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NCSC513",
        courseName: "Artificial Intelligence",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "CSE CR2" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "CSE CR2" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "CSE CR2" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "CSE CR2" }
        ]
    },
    {
        courseCode: "NCSD518",
        courseName: "Data Mining",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR2" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR2" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "CSE CR2" }
        ]
    },
    {
        courseCode: "NCSD519",
        courseName: "Machine Learning",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("8:00 AM-8:50 AM"), "venue": "NAC Hall" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "NAC Hall" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "NAC Hall" }
        ]
    },
    {
        courseCode: "NCSC514",
        courseName: "Artificial Intelligence Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "CSE LAB - III" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "CSE LAB - III" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "CSE LAB - III" }
        ]
    },
    {
        courseCode: "NCSE101",
        courseName: "Fundamental of Data Structures",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NPHC101",
        courseName: "Wave and Acoustics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G3" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G3" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G3" }
        ]
    },
    {
        courseCode: "NPHC102",
        courseName: "Wave and Acoustics Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "UG Lab-1" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "UG Lab-1" }
        ]
    },
    {
        courseCode: "NPHI101",
        courseName: "Engineering Physics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G4" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G4" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-G4" }
        ]
    },
    {
        courseCode: "NPHI102",
        courseName: "Engineering Physics Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NPHC201",
        courseName: "Classical Mechanics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C20" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C20" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C20" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C20" }
        ]
    },
    {
        courseCode: "NPHC202",
        courseName: "Mathematical Physics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C20" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C20" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C20" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C20" }
        ]
    },
    {
        courseCode: "NPHC203",
        courseName: "Electricity and Magnetism",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C20" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C20" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C20" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C20" }
        ]
    },
    {
        courseCode: "NPHC204",
        courseName: "Electricity and Magnetism Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "UG Lab-1" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "UG Lab-1" }
        ]
    },
    {
        courseCode: "NPHC205",
        courseName: "Mechanics Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "UG Lab-1" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "UG Lab-1" }
        ]
    },
    {
        courseCode: "NPHC501",
        courseName: "Classical Mechanics and Special Theory of Relativity",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C19" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C19" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC502",
        courseName: "Methods of Mathematical Physics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C19" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC503",
        courseName: "Quantum Mechanics-I",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C19" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C19" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC504",
        courseName: "Electronics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C19" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C19" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC505",
        courseName: "Numerical Methods and Computer Programming",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G5" },
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G5" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G5" }
        ]
    },
    {
        courseCode: "NPHC506",
        courseName: "Experimental Physics I",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "PG Lab-1" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "PG Lab-1" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "PG Lab-1" }
        ]
    },
    {
        courseCode: "NPHC507",
        courseName: "Experimental Physics II",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "PG Lab-1" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "PG Lab-1" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "PG Lab-1" }
        ]
    },
    {
        courseCode: "NPHC514",
        courseName: "Statistical Mechanics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C19" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C19" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC515",
        courseName: "Atomic and Molecular Physics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C19" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C19" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC595",
        courseName: "Research Methodology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C19" },
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHC516",
        courseName: "Experimental Physics V",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "CSE LAB - II" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "CSE LAB - II" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "CSE LAB - II" }
        ]
    },
    {
        courseCode: "NPHC517",
        courseName: "Experimental Physics VI",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "PG Lab-1" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "PG Lab-1" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab-1" }
        ]
    },
    {
        courseCode: "NPHD511",
        courseName: "Plasma Physics: Fundamentals and Applications",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C19" },
            { "day": "Tuesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C19" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPEC101",
        courseName: "Elements of Reservoir Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G2" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G2" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G2" }
        ]
    },
    {
        courseCode: "NPEC102",
        courseName: "Reservoir Engineering Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "PE Reservoir Engineering laboratory" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "PE Reservoir Engineering laboratory" }
        ]
    },
    {
        courseCode: "NPEC201",
        courseName: "Drilling Technology - I",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "PET 1" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "PET 1" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "PET 1" }
        ]
    },
    {
        courseCode: "NPEC202",
        courseName: "Geoscience for Petroleum Engineers",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "PET 1" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "PET 1" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "PET 1" }
        ]
    },
    {
        courseCode: "NPEC203",
        courseName: "Petroleum Formation Evaluation",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "PET 1" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "PET 1" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "PET 1" }
        ]
    },
    {
        courseCode: "NPEC204",
        courseName: "Petroleum Product Testing Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "Production and Product Testing Laboratory" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "Production and Product Testing Laboratory" }
        ]
    },
    {
        courseCode: "NPEC205",
        courseName: "Drilling Fluid and Cementing Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "Drilling Fluids and Cement laboratory" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "Drilling Fluids and Cement laboratory" }
        ]
    },
    {
        courseCode: "NPEE201",
        courseName: "Health, Safety and Environment in Petroleum Industry",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "PET 1" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "PET 1" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "PET 1" }
        ]
    },
    {
        courseCode: "NPEC501",
        courseName: "Advanced Production Technologies",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "PET 4" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "PET 4" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "PET 4" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "PET 4" }
        ]
    },
    {
        courseCode: "NPEC502",
        courseName: "Advanced Well Testing",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "PET 4" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "PET 4" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "PET 4" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "PET 4" }
        ]
    },
    {
        courseCode: "NPEC503",
        courseName: "Formation Evaluation and Production Logging",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "PET 4" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "PET 4" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "PET 4" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "PET 4" }
        ]
    },
    {
        courseCode: "NPED502",
        courseName: "Fluid Flow Through Porous Media",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NPED503",
        courseName: "Introduction to Python and Petroleum Data Analysis",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "PET 4" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "PET 4" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "PET 4" }
        ]
    },
    {
        courseCode: "NPEC504",
        courseName: "Reservoir Characterization",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "Reservoir Characterization Lab" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "Reservoir Characterization Lab" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "Reservoir Characterization Lab" }
        ]
    },
    {
        courseCode: "NPEC505",
        courseName: "Term paper/Mini Project",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "PET 4" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "PET 4" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "PET 4" }
        ]
    },
    {
        courseCode: "NPEC506",
        courseName: "Production Logging Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "Reservoir Characterization Lab" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "Reservoir Characterization Lab" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "Reservoir Characterization Lab" }
        ]
    },
    {
        courseCode: "NCYI101",
        courseName: "Engineering Chemistry",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C1" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C1" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C1" }
        ]
    },
    {
        courseCode: "NCYI102",
        courseName: "Engineering Chemistry Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "Lab" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "Lab" }
        ]
    },
    {
        courseCode: "NCYC501",
        courseName: "Basics of Pharmacology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C16" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C16" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCHC525",
        courseName: "Unit Operations for Pharmaceutics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C16" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C16" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCYC502",
        courseName: "Formulation & Drug Delivery Technology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C16" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C16" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCYD504",
        courseName: "Introduction to Biomolecules and Bioprocesses",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C16" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCYD528",
        courseName: "Instrumental Techniques for Material Characterization",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NCYD542",
        courseName: "Numerical Analysis and Methods in Chemistry",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C16" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C16" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCYD543",
        courseName: "Organic Synthesis and Process Technology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NCYC503",
        courseName: "Process Chemistry Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "Chem PHSE Lab" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "Chem PHSE Lab" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "Chem PHSE Lab" }
        ]
    },
    {
        courseCode: "NCYC504",
        courseName: "Instrumental Method of Analysis Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "Chem PHSE Lab" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "Chem PHSE Lab" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "Chem PHSE Lab" }
        ]
    },
    {
        courseCode: "NCYC505",
        courseName: "Chemical Biology Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "Chem PHSE Lab" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "Chem PHSE Lab" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "Chem PHSE Lab" }
        ]
    },
    {
        courseCode: "NCYC511",
        courseName: "Physical Organic Chemistry",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C12" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C12" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYC510",
        courseName: "Quantum Chemistry",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C12" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYC512",
        courseName: "Group Theory",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C12" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYC514",
        courseName: "Main Group Chemistry",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C12" },
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYC513",
        courseName: "Application of Spectroscopic Methods",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C12" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYC516",
        courseName: "Organic Chemistry Lab – I",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NCYC515",
        courseName: "Inorganic Chemistry Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "PG Lab" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "PG Lab" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "PG Lab" }
        ]
    },
    {
        courseCode: "NCYC524",
        courseName: "Photochemistry & Pericyclic reactions",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C12" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYC525",
        courseName: "Organometallic Chemistry",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C12" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYD524",
        courseName: "Solid State Materials: Chemistry & Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C12" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYD516",
        courseName: "Advanced heterocyclic chemistry",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C4" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C4" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C4" }
        ]
    },
    {
        courseCode: "NCYD515",
        courseName: "Advances in Nonconventional Energy Systems",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C12" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C12" },
            { "day": "Friday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NCYD527",
        courseName: "Science of Corrosion & Corrosion Control",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C4" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C4" },
            { "day": "Friday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C4" }
        ]
    },
    {
        courseCode: "NCYD512",
        courseName: "Functional Material and Heterogeneous Catalysis",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C7" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C7" },
            { "day": "Friday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C7" }
        ]
    },
    {
        courseCode: "NCYC526",
        courseName: "Material Chemistry lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "PG Lab" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "PG Lab" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab" }
        ]
    },
    {
        courseCode: "NCYC523",
        courseName: "Computational Chemistry Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "NLHC Computer Lab - I" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "NLHC Computer Lab - I" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "NLHC Computer Lab - I" }
        ]
    },
    {
        courseCode: "NCYC595",
        courseName: "Research Methodology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C12" },
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C12" },
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C12" }
        ]
    },
    {
        courseCode: "NHSC501",
        courseName: "Introduction to Digital Humanities",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -1" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC502",
        courseName: "Statistics for Humanities and Social Sciences",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -1" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -1" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC503",
        courseName: "Corpus Linguistics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "HSS class room -1" },
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -1" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC504",
        courseName: "E-Literature",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -1" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -1" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC595",
        courseName: "Research Methodology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: []
    },
    {
        courseCode: "NHSC505",
        courseName: "Effective Communication Skills",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "HSS class room -2" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -2" }
        ]
    },
    {
        courseCode: "NHSC506",
        courseName: "Social Research Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "HSS class room -2" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -2" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "HSS class room -2" }
        ]
    },
    {
        courseCode: "NHSC510",
        courseName: "Social Theory in Digital Era",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "HSS class room -1" },
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "HSS class room -1" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC513",
        courseName: "Privacy, Morality and the Law",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "HSS class room -1" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "HSS class room -1" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC514",
        courseName: "The Psychology of the Internet",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -1" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -1" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSD509",
        courseName: "Introduction to Yoga Philosophy",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "HSS class room -1" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "HSS class room -1" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSD501",
        courseName: "Introduction to Drama, Theatre and Performance Studies",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "HSS class room -1" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "HSS class room -1" },
            { "day": "Friday", ...time("12:00 PM-12:50 PM"), "venue": "HSS class room -1" }
        ]
    },
    {
        courseCode: "NHSC516",
        courseName: "Seminar",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -2" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -2" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "HSS class room -2" }
        ]
    },
    {
        courseCode: "NHSC512",
        courseName: "Digital Humanities Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "HSS class room -2" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "HSS class room -2" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "HSS class room -2" }
        ]
    },
    {
        courseCode: "NHSA101",
        courseName: "Communication Skills",
        ltp: "1-0-0",
        credits: calculateCreditsFromLTP("1-0-0", courseOption),
        slots: [
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NHSA102",
        courseName: "Communication Skills Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "NLHC Computer Lab - III" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "NLHC Computer Lab - III" }
        ]
    },
    {
        courseCode: "NHSA103",
        courseName: "Understanding Human Behaviour",
        ltp: "2-1-0",
        credits: calculateCreditsFromLTP("2-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G1" },
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G1" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NFME101",
        courseName: "Introduction to Materials Science & Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G1" },
            { "day": "Thursday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G1" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NFMC101",
        courseName: "Introduction to Metallurgical Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G6" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G6" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G6" }
        ]
    },
    {
        courseCode: "NFMC102",
        courseName: "Introduction to Metallurgical Engineering Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMA201",
        courseName: "Communition and Classification",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "FME-2" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "FME-2" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMC201",
        courseName: "Thermodynamics and Kinetics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "FME-2" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "FME-2" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "FME-2" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMC202",
        courseName: "Extractive Metallurgy",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "FME-2" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "FME-2" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "FME-2" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMC203",
        courseName: "Physical Separation Processes I",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "FME-2" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "FME-2" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "FME-2" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMC204",
        courseName: "Communition and Classification Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMC205",
        courseName: "Extractive Metallurgy Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMC522",
        courseName: "Fuel Technology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C10" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C10" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C10" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C10" }
        ]
    },
    {
        courseCode: "NFMC502",
        courseName: "Coal & Mineral Beneficiation",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C10" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C10" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C10" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C10" }
        ]
    },
    {
        courseCode: "NFMC523",
        courseName: "Alternate Energy Systems",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C10" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C10" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-C10" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C10" }
        ]
    },
    {
        courseCode: "NFMD510",
        courseName: "Biofuels",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C10" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C10" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C10" }
        ]
    },
    {
        courseCode: "NFMD501",
        courseName: "Powerplant Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C10" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C10" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C10" }
        ]
    },
    {
        courseCode: "NFMC524",
        courseName: "Thermochemical Conversion Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMC505",
        courseName: "Mineral Processing Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMC506",
        courseName: "Fuel Technology Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "" },
        ]
    },
    {
        courseCode: "NFMC501",
        courseName: "Size Preparation Technology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "FME-1" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "FME-1" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "FME-1" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "FME-1" }
        ]
    },
    {
        courseCode: "NFMC503",
        courseName: "Process Metallurgy",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "FME-2" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "FME-2" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "FME-2" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMD502",
        courseName: "Dewatering and Drying",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "FME-1" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "FME-1" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "FME-1" }
        ]
    },
    {
        courseCode: "NFMD513",
        courseName: "Critical and Nuclear Materials Resource Recovery",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "FME-1" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "FME-1" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "FME-1" }
        ]
    },
    {
        courseCode: "NFMC504",
        courseName: "Non-ferrous Extractive Metallurgy Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMC513",
        courseName: "Mechanical Behaviour of Materials",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "FME-2" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "FME-2" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "FME-2" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMC514",
        courseName: "Advanced Thermodynamics and Kinetics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "FME-2" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "FME-2" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "FME-2" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMD504",
        courseName: "Numerical Methods in Metallurgical Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "FME-2" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "FME-2" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMD505",
        courseName: "Advanced Materials and Applications",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "FME-2" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "FME-2" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "FME-2" }
        ]
    },
    {
        courseCode: "NFMC515",
        courseName: "Mechanical Behaviour of Materials Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NFMC516",
        courseName: "Computer Applications in Metallurgical Engineering lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NPHD510",
        courseName: "Quantum Computation and Information",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C19" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C19" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C19" }
        ]
    },
    {
        courseCode: "NPHD523",
        courseName: "Characterization Techniques",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C20" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C20" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C20" }
        ]
    },
    {
        courseCode: "NMCI101",
        courseName: "Engineering Mathematics - I",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G1" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G1" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NMCE101",
        courseName: "Statistical Methods",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G3" },
            { "day": "Thursday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G3" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G3" }
        ]
    },
    {
        courseCode: "NMCE201",
        courseName: "Basics on Probability and Statistics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G7" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G7" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G7" }
        ]
    },
    {
        courseCode: "NMCA201",
        courseName: "Discrete Mathematics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G7" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G7" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G7" }
        ]
    },
    {
        courseCode: "NMCC111",
        courseName: "Algebra",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G5" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G5" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G5" }
        ]
    },
    {
        courseCode: "NMCC112",
        courseName: "Computing Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "NLHC Computer Lab - II" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "NLHC Computer Lab - II" }
        ]
    },
    {
        courseCode: "NMCC211",
        courseName: "Algebra",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G7" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G7" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G7" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-G7" }
        ]
    },
    {
        courseCode: "NMCC202",
        courseName: "Design and Analysis of Algorithms",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G7" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G7" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G7" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-G7" }
        ]
    },
    {
        courseCode: "NMCC203",
        courseName: "Differential Equations",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G7" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G7" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G7" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-G7" }
        ]
    },
    {
        courseCode: "NMCC212",
        courseName: "Computing Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "NLHC Computer lab 3" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "NLHC Computer lab 3" }
        ]
    },
    {
        courseCode: "NMCC205",
        courseName: "Design and Analysis of Algorithms Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "NLHC Computer Lab - I" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "NLHC Computer Lab - I" }
        ]
    },
    {
        courseCode: "NMCC501",
        courseName: "Numerical Linear Algebra",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-I-C16" },
            { "day": "Thursday", ...time("2:00 PM-2:50 PM"), "venue": "LC-I-C16" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-I-C16" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C16" }
        ]
    },
    {
        courseCode: "NMCC502",
        courseName: "Fundamentals of Machine Learning",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("6:00 PM-6:50 PM"), "venue": "LC-I-C15" },
            { "day": "Tuesday", ...time("6:00 PM-6:50 PM"), "venue": "LC-I-C15" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C15" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-I-C15" }
        ]
    },
    {
        courseCode: "NMCC503",
        courseName: "Statistics in Decision Makings",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C15" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C15" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C15" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-I-C15" }
        ]
    },
    {
        courseCode: "NMCD510",
        courseName: "GPU Computing",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G15" },
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G15" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G15" }
        ]
    },
    {
        courseCode: "NMCD535",
        courseName: "Statistical Inference",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C11" },
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C11" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C11" }
        ]
    },
    {
        courseCode: "NMCC504",
        courseName: "Numerical Linear Algebra Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NMCC505",
        courseName: "Fundamentals of Machine Learning Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NMCC506",
        courseName: "Statistics in Decision Makings Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "" }
        ]
    },
    {
        courseCode: "NMCC513",
        courseName: "Probability & Statistics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C11" },
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G15" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G15" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G15" }
        ]
    },
    {
        courseCode: "NMCC514",
        courseName: "Advanced Algebra",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C11" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C11" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C11" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C11" }
        ]
    },
    {
        courseCode: "NMCC515",
        courseName: "Differential Equations",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-C11" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G15" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G15" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G15" }
        ]
    },
    {
        courseCode: "NMCC516",
        courseName: "Advanced Numerical Methods",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G15" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G15" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G15" }
        ]
    },
    {
        courseCode: "NMCC517",
        courseName: "Data Structures",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C11" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C11" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C11" }
        ]
    },
    {
        courseCode: "NMCC518",
        courseName: "Advanced Numerical Methods Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "NLHC Computer lab 3" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "NLHC Computer lab 3" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "NLHC Computer lab 3" }
        ]
    },
    {
        courseCode: "NMCC519",
        courseName: "Data Structures Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "NLHC Computer Lab - II" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "NLHC Computer Lab - II" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "NLHC Computer Lab - II" }
        ]
    },
    {
        courseCode: "NMCC526",
        courseName: "Design and Analysis of Algorithms",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C11" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C11" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C11" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C11" }
        ]
    },
    {
        courseCode: "NMCC527",
        courseName: "Computational Fluid Dynamics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C11" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C11" },
            { "day": "Tuesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C11" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C11" }
        ]
    },
    {
        courseCode: "NMCD508",
        courseName: "Big Data",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G15" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-G15" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-G15" }
        ]
    },
    {
        courseCode: "NMCD518",
        courseName: "Optimization Techniques",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G15" },
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G15" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G15" }
        ]
    },
    {
        courseCode: "NMCC595",
        courseName: "Research Methodology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C11" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C11" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C11" }
        ]
    },
    {
        courseCode: "NMCC528",
        courseName: "Design and Analysis of Algorithms Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "NLHC Computer Lab - I" },
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "NLHC Computer Lab - I" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "NLHC Computer Lab - I" }
        ]
    },
    {
        courseCode: "NMCC529",
        courseName: "Computational Fluid Dynamics Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "" }
        ]
    },
    {
        courseCode: "NPEA201",
        courseName: "AI/ML for Petroleum Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "PET 1" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "PET 1" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "PET 1" }
        ]
    },
    {
        courseCode: "NPEE101",
        courseName: "Introduction to Petroleum Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-C8" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C8" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-C8" }
        ]
    },
    {
        courseCode: "NEEA201",
        courseName: "Numerical Simulation in Electrical Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G9" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G9" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G9" }
        ]
    },
    {
        courseCode: "NMNC101",
        courseName: "Mine Economics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G4" },
            { "day": "Tuesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G4" },
            { "day": "Wednesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G4" }
        ]
    },
    {
        courseCode: "NMNC102",
        courseName: "Mining Technology Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "CAMPAD Lab" },
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "CAMPAD Lab" }
        ]
    },
    {
        courseCode: "NMNE101",
        courseName: "Mine to Mill Operations",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G6" },
            { "day": "Thursday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G6" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G6" }
        ]
    },
    {
        courseCode: "NCSA201",
        courseName: "Cyber Threat Awareness and Prevention",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G12" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G12" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G12" }
        ]
    },
    {
        courseCode: "NMNC201",
        courseName: "Mine Surveying",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G12" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G12" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G12" }
        ]
    },
    {
        courseCode: "NMNC202",
        courseName: "Rock Mechanics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G12" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G12" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G12" }
        ]
    },
    {
        courseCode: "NMNC203",
        courseName: "Surface Mining",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G12" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G12" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G12" }
        ]
    },
    {
        courseCode: "NMNC204",
        courseName: "Mine Surveying Practical",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "Mine Survey Lab" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "Mine Survey Lab" }
        ]
    },
    {
        courseCode: "NMNC205",
        courseName: "Rock Mechanics Practical",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "Rock Mechanic Lab" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "Rock Mechanic Lab" }
        ]
    },
    {
        courseCode: "NMNC501",
        courseName: "Computational Geomechanics and Ground Control",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "ME-MIN1" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN1" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN1" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN1" }
        ]
    },
    {
        courseCode: "NMNC502",
        courseName: "Computational Subsurface Ventilation and Environment",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN1" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "ME-MIN1" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN1" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN1" }
        ]
    },
    {
        courseCode: "NMNC503",
        courseName: "Risk and Workplace Safety Management",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN1" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN1" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "ME-MIN1" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN1" }
        ]
    },
    {
        courseCode: "NMND501",
        courseName: "Managerial Decision Making",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN1" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN1" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN1" }
        ]
    },
    {
        courseCode: "NMND503",
        courseName: "Modern Blasting Technology in Mining",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN1" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN1" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN1" }
        ]
    },
    {
        courseCode: "NMNC504",
        courseName: "Computational Geomechanics and Ground Control Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "Rock Mechanic Lab" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "Rock Mechanic Lab" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "Rock Mechanic Lab" }
        ]
    },
    {
        courseCode: "NMNC505",
        courseName: "Computational Subsurface Ventilation and Environment Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "Mine Ventilation Lab" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "Mine Ventilation Lab" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "Mine Ventilation Lab" }
        ]
    },
    {
        courseCode: "NMNC506",
        courseName: "Numerical Modelling Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "CAMPAD Lab" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "CAMPAD Lab" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "CAMPAD Lab" }
        ]
    },
    {
        courseCode: "NMNC509",
        courseName: "Mine Surveying Techniques",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "PG Lab-1 Geomatics" }
        ]
    },
    {
        courseCode: "NMNC510",
        courseName: "Geographical Information System",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN2" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "ME-MIN2" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN2" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN2" }
        ]
    },
    {
        courseCode: "NMNC511",
        courseName: "Remote Sensing and Digital Image Processing",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "PG Lab-1 Geomatics" }
        ]
    },
    {
        courseCode: "NMND502",
        courseName: "Geospatial Technologies for Natural Resources",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab-1 Geomatics" }
        ]
    },
    {
        courseCode: "NMND507",
        courseName: "UAV Data Mapping and Applications",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab-1 Geomatics" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "PG Lab-1 Geomatics" }
        ]
    },
    {
        courseCode: "NMNC512",
        courseName: "Remote Sensing and Image Processing Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "CAMPAD Lab" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "CAMPAD Lab" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "CAMPAD Lab" }
        ]
    },
    {
        courseCode: "NMNC513",
        courseName: "GIS Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "CAMPAD Lab" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "CAMPAD Lab" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "CAMPAD Lab" }
        ]
    },
    {
        courseCode: "NMNC514",
        courseName: "Advanced Surveying Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "Mine Survey Lab" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "Mine Survey Lab" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "Mine Survey Lab" }
        ]
    },
    {
        courseCode: "NMNC507",
        courseName: "Geomechanics for Underground Space",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "ME-MIN2" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN2" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "ME-MIN2" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "ME-MIN2" }
        ]
    },
    {
        courseCode: "NMND504",
        courseName: "Analysis and Design of Slopes",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN2" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN2" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "ME-MIN2" }
        ]
    },
    {
        courseCode: "NMND506",
        courseName: "Elements of Mining Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("6:00 PM-6:50 PM"), "venue": "ME-MIN2" },
            { "day": "Tuesday", ...time("6:00 PM-6:50 PM"), "venue": "ME-MIN2" },
            { "day": "Wednesday", ...time("6:00 PM-6:50 PM"), "venue": "ME-MIN2" }
        ]
    },
    {
        courseCode: "NMNC508",
        courseName: "Geomechanics Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "Rock Mechanic Lab" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "Rock Mechanic Lab" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "Rock Mechanic Lab" }
        ]
    },
    {
        courseCode: "NCHC101",
        courseName: "Introduction to Chemical Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G1" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G1" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NCHC102",
        courseName: "Unit Operations Lab",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "CHE-434" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "CHE-434" }
        ]
    },
    {
        courseCode: "NCHE101",
        courseName: "Unit Operations and Unit Processes",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C5" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C5" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C5" }
        ]
    },
    {
        courseCode: "NCHA201",
        courseName: "Mechanical Operations",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C16" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C16" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCHC201",
        courseName: "Fluid Mechanics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C16" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-I-C16" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCHC202",
        courseName: "Heat Transfer",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C16" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C16" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCHC203",
        courseName: "Introduction to Engineering Thermodynamics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C16" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C16" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C16" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCHC204",
        courseName: "Fluid and Particle Mechanics Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "CHE 407" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "CHE 407" }
        ]
    },
    {
        courseCode: "NCHC205",
        courseName: "Heat Transfer Laboratory",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "CHE 407" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "CHE 407" }
        ]
    },
    {
        courseCode: "NCHE201",
        courseName: "Chemical Process Technology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C16" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C16" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C16" }
        ]
    },
    {
        courseCode: "NCHC501",
        courseName: "Advanced Transport Phenomena",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "CHE-402" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "CHE-402" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "CHE-402" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "CHE-402" }
        ]
    },
    {
        courseCode: "NCHC502",
        courseName: "Advanced Chemical Engineering Thermodynamics",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "CHE-402" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "CHE-402" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "CHE-402" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "CHE-402" }
        ]
    },
    {
        courseCode: "NCHC503",
        courseName: "Computational Techniques in Chemical Engineering",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "CHE-402" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "CHE-402" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "CHE-402" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "CHE-402" }
        ]
    },
    {
        courseCode: "NCHD502",
        courseName: "Nanotechnology",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-402" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-402" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-402" }
        ]
    },
    {
        courseCode: "NCHD511",
        courseName: "Electrochemical Energy Science and Engineering",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "CHE-402" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-402" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-402" }
        ]
    },
    {
        courseCode: "NCHD510",
        courseName: "Introduction to Granular Mechanics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "CHE-401" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-401" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "CHE-401" }
        ]
    },
    {
        courseCode: "NCHC504",
        courseName: "Computational Techniques Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "NLHC Computer Lab - II" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "NLHC Computer Lab - II" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "NLHC Computer Lab - II" }
        ]
    },
    {
        courseCode: "NCHC505",
        courseName: "Advanced Process Simulation Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "CSE LAB -IV" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "CSE LAB -IV" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "CSE LAB -IV" }
        ]
    },
    {
        courseCode: "NCHC506",
        courseName: "Instrumental Methods of Analysis",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "CHE-434" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "CHE-434" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "CHE-434" }
        ]
    },
    {
        courseCode: "NESV101",
        courseName: "Environmental Science",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G1" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-G1" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G1" }
        ]
    },
    {
        courseCode: "NESC101",
        courseName: "Drinking Water Supply and Treatment",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G5" },
            { "day": "Tuesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G5" },
            { "day": "Wednesday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G5" }
        ]
    },
    {
        courseCode: "NESC102",
        courseName: "Water Pollution Practical",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "Water Chemistry Lab" },
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "Water Chemistry Lab" }
        ]
    },
    {
        courseCode: "NESA201",
        courseName: "Environmental Policy and Legislation",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C8" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C8" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-C8" }
        ]
    },
    {
        courseCode: "NESE201",
        courseName: "Noise Pollution and Control",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C8" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C8" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "LC-II-C8" }
        ]
    },
    {
        courseCode: "NESC201",
        courseName: "Air Pollution Control",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C8" },
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C8" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C8" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C8" }
        ]
    },
    {
        courseCode: "NESC202",
        courseName: "Environmental Geotechnology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C8" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C8" },
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C8" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C8" }
        ]
    },
    {
        courseCode: "NESC203",
        courseName: "Introduction to Ecology and Environmental Microbiology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C8" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "LC-II-C8" },
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-C8" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "LC-II-C8" }
        ]
    },
    {
        courseCode: "NESC204",
        courseName: "Environmental Geotechnology Practical",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "Lab" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "Lab" }
        ]
    },
    {
        courseCode: "NESC205",
        courseName: "Soil and Environmental Microbiology Practical",
        ltp: "0-0-2",
        credits: calculateCreditsFromLTP("0-0-2", courseOption),
        slots: [
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "Microbiology Lab" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "Microbiology Lab" }
        ]
    },
    {
        courseCode: "NESC501",
        courseName: "Ecology and Environmental Microbiology",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G10" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G10" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G10" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NESC502",
        courseName: "Water and Wastewater Engineering",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G10" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G10" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G10" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NESC503",
        courseName: "Air and Noise Pollution",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G10" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G10" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G10" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NESD501",
        courseName: "Environmental Modelling",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G10" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G10" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NESD502",
        courseName: "Groundwater Flow and Contaminant Transport Modelling",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G10" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G10" },
            { "day": "Friday", ...time("5:00 PM-5:50 PM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NESC504",
        courseName: "Water and Wastewater Engineering Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "Water Chemistry Lab" },
            { "day": "Wednesday", ...time("10:00 AM-10:50 AM"), "venue": "Water Chemistry Lab" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "Water Chemistry Lab" }
        ]
    },
    {
        courseCode: "NESC505",
        courseName: "Soil and Microbiology Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("9:00 AM-9:50 AM"), "venue": "Microbiology Lab" },
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "Microbiology Lab" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "Microbiology Lab" }
        ]
    },
    {
        courseCode: "NESC506",
        courseName: "Air and Noise Monitoring Practical",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "Air Lab" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "Air Lab" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "Air Lab" }
        ]
    },
    {
        courseCode: "NMSA201",
        courseName: "Microeconomics: Theory and Practice",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("9:00 AM-9:50 AM"), "venue": "LC-II-G10" },
            { "day": "Thursday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G10" },
            { "day": "Friday", ...time("8:00 AM-8:50 AM"), "venue": "LC-II-G10" }
        ]
    },
    {
        courseCode: "NMSC501",
        courseName: "Manufacturing System Engineering",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "MS 113" },
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 113" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "MS 113" },
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "MS 113" } 
        ]
    },
    {
        courseCode: "NMSC502",
        courseName: "Decision Modeling",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G13" },
            { "day": "Tuesday", ...time("2:00 PM-2:50 PM"), "venue": "LC-II-G13" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "LC-II-G13" },
            { "day": "Thursday", ...time("4:00 PM-4:50 PM"), "venue": "LC-II-G13" }
        ]
    },
    {
        courseCode: "NMSC503",
        courseName: "Machine Learning",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "MS 011" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 011" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "MS 011" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "MS 011" }
        ]
    },
    {
        courseCode: "NMSD504",
        courseName: "Materials Management",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "MS 010" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "MS 010" },
            { "day": "Friday", ...time("12:00 PM-12:50 PM"), "venue": "MS 010" }
        ]
    },
    {
        courseCode: "NMSC504",
        courseName: "Stochastic Programming Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Monday", ...time("9:00 AM-9:50 AM"), "venue": "MS 010" },
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "MS 010" },
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "MS 010" }
        ]
    },
    {
        courseCode: "NMSC505",
        courseName: "Spreadsheet Modelling",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Thursday", ...time("10:00 AM-10:50 AM"), "venue": "NLHC Computer Lab - III" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "NLHC Computer lab 3" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "NLHC Computer Lab - III" }
        ]
    },
    {
        courseCode: "NMSC506",
        courseName: "Machine Learning Lab",
        ltp: "0-0-3",
        credits: calculateCreditsFromLTP("0-0-3", courseOption),
        slots: [
            { "day": "Friday", ...time("9:00 AM-9:50 AM"), "venue": "MS 209" },
            { "day": "Friday", ...time("10:00 AM-10:50 AM"), "venue": "MS 209" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "MS 209" }
        ]
    },
    {
        courseCode: "NMSC513",
        courseName: "Organizational Behaviour",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "MS 209" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 209" },
            { "day": "Thursday", ...time("5:00 PM-5:50 PM"), "venue": "MS 209" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "MS 209" }
        ]
    },
    {
        courseCode: "NMSC514",
        courseName: "Managerial Economics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("4:00 PM-4:50 PM"), "venue": "MS 210" },
            { "day": "Wednesday", ...time("4:00 PM-4:50 PM"), "venue": "MS 210" },
            { "day": "Friday", ...time("3:00 PM-3:50 PM"), "venue": "MS 210" }
        ]
    },
    {
        courseCode: "NMSC515",
        courseName: "Management Principles & Practice",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 210" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "MS 210" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "MS 210" }
        ]
    },
    {
        courseCode: "NMSC516",
        courseName: "Financial Accounting and Reporting",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Monday", ...time("4:00 PM-4:50 PM"), "venue": "MS 209" },
            { "day": "Tuesday", ...time("5:00 PM-5:50 PM"), "venue": "MS 209" },
            { "day": "Wednesday", ...time("2:00 PM-2:50 PM"), "venue": "MS 209" },
            { "day": "Friday", ...time("4:00 PM-4:50 PM"), "venue": "MS 209" }
        ]
    },
    {
        courseCode: "NMSD514",
        courseName: "Organizational Development and Change",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "MS 111" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "MS 111" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "MS 111" }
        ]
    },
    {
        courseCode: "NMSD522",
        courseName: "Computational Finance",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "MS 113" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "MS 113" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "MS 113" }
        ]
    },
    {
        courseCode: "NMSD508",
        courseName: "Personal Management & Industrial Relations",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "MS 111" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "MS 111" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "MS 111" }
        ]
    },
    {
        courseCode: "NMSD505",
        courseName: "Investment Analysis and Portfolio Management",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("11:00 AM-11:50 AM"), "venue": "MS 210" },
            { "day": "Tuesday", ...time("12:00 PM-12:50 PM"), "venue": "MS 210" },
            { "day": "Friday", ...time("11:00 AM-11:50 AM"), "venue": "MS 210" }
        ]
    },
    {
        courseCode: "NMSD509",
        courseName: "Human Resource Development",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "MS 113" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "MS 113" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "MS 113" }
        ]
    },
    {
        courseCode: "NMSD506",
        courseName: "Management of Banks and Financial Institutions",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("12:00 PM-12:50 PM"), "venue": "MS 210" },
            { "day": "Wednesday", ...time("11:00 AM-11:50 AM"), "venue": "MS 210" },
            { "day": "Thursday", ...time("12:00 PM-12:50 PM"), "venue": "MS 210" }
        ]
    },
    {
        courseCode: "NMSD502",
        courseName: "Financial Analytics",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Tuesday", ...time("10:00 AM-10:50 AM"), "venue": "MS 210" },
            { "day": "Wednesday", ...time("12:00 PM-12:50 PM"), "venue": "MS 210" },
            { "day": "Friday", ...time("12:00 PM-12:50 PM"), "venue": "MS 210" }
        ]
    },
    {
        courseCode: "NMSC521",
        courseName: "Statistical Methods & Applications",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("2:00 PM-2:50 PM"), "venue": "MS 010" },
            { "day": "Tuesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 010" },
            { "day": "Wednesday", ...time("5:00 PM-5:50 PM"), "venue": "MS 010" }
        ]
    },
    {
        courseCode: "NMSC522",
        courseName: "Data Mining for Business",
        ltp: "3-1-0",
        credits: calculateCreditsFromLTP("3-1-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 113" },
            { "day": "Thursday", ...time("3:00 PM-3:50 PM"), "venue": "MS 113" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "MS 113" },
            { "day": "Monday", ...time("5:00 PM-5:50 PM"), "venue": "MS 113" }
        ]
    },
    {
        courseCode: "NMSD521",
        courseName: "Supply chain management",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Wednesday", ...time("3:00 PM-3:50 PM"), "venue": "MS 210" },
            { "day": "Thursday", ...time("2:00 PM-2:50 PM"), "venue": "MS 210" },
            { "day": "Friday", ...time("2:00 PM-2:50 PM"), "venue": "MS 210" }
        ]
    },
    {
        courseCode: "NMSD501",
        courseName: "CONSUMER BEHAVIOUR",
        ltp: "3-0-0",
        credits: calculateCreditsFromLTP("3-0-0", courseOption),
        slots: [
            { "day": "Monday", ...time("10:00 AM-10:50 AM"), "venue": "MS 011" },
            { "day": "Tuesday", ...time("11:00 AM-11:50 AM"), "venue": "MS 011" },
            { "day": "Thursday", ...time("11:00 AM-11:50 AM"), "venue": "MS 011" }
        ]
    }
];