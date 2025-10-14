import {TimeTableCourse} from '../types';

const calculateCredits = (ltp: string): number => {
    if (!ltp || typeof ltp !== 'string' || ltp.split('-').length !== 3) {
        return 0;
    }
    const parts = ltp.split('-').map(Number);
    if (parts.some(isNaN)) {
        return 0;
    }
    const [l, t, p] = parts;
    return (3 * l) + (2 * t) + (1 * p);
};

export const TIMETABLE_DATA: TimeTableCourse[] = [
    {
        "courseCode": "CHC202",
        "courseName": "Fluid and Particle Mechanics",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C16" },
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C16" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C16" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C16" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C2" }
        ]
    },
    {
        "courseCode": "CHC203",
        "courseName": "Heat Transfer",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C16" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C16" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C16" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C16" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C16" }
        ]
    },
    {
        "courseCode": "CHC205",
        "courseName": "Fluid and Particle Mechanics Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "CHE 407" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "CHE 407" }
        ]
    },
    {
        "courseCode": "CHE201",
        "courseName": "Engineering Thermodynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C13" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C13" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CSC202",
        "courseName": "Discrete Mathematics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G10" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G10" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G10" }
        ]
    },
    {
        "courseCode": "CSC203",
        "courseName": "Computer Organization",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "CSE CR2" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "CSE CR2" },
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "CSE CR2" }
        ]
    },
    {
        "courseCode": "CSC205",
        "courseName": "Computer Organization Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "CSE LAB - I" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "CSE LAB - I" }
        ]
    },
    {
        "courseCode": "CSE201",
        "courseName": "Data Structures and Algorithms",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "NAC Hall" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "NAC Hall" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CEC201",
        "courseName": "Surveying",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "CECR3" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "CECR3" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "CECR3" }
        ]
    },
    {
        "courseCode": "CEC203",
        "courseName": "Building Materials, Construction and Management",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "CECR1" },
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "CECR1" },
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "CECR1" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "CECR1" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "CECR1" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "CECR1" }
        ]
    },
    {
        "courseCode": "CEC204",
        "courseName": "Material Testing Laboratory",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "CEDept" },
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "CEDept" }
        ]
    },
    {
        "courseCode": "CEE201",
        "courseName": "Mechanics of Solid",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C14" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C14" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C14" }
        ]
    },
    {
        "courseCode": "ECC202",
        "courseName": "Signals & Networks",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G11" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G11" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G11" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G11" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "ECC203",
        "courseName": "Digital Circuits and System Design",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G11" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G12" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "ECC204",
        "courseName": "Digital System Design Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "Digital Electronics Lab (635)" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "Digital Electronics Lab (635)" }
        ]
    },
    {
        "courseCode": "ECC205",
        "courseName": "Signals & Networks Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "Electronics Main Lab I (231)" },
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "Electronics Main Lab I (231)" }
        ]
    },
    {
        "courseCode": "EEC201",
        "courseName": "Signals, Systems and Networks",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G9" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G9" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G9" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEC202",
        "courseName": "Analog and Digital Electronics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G9" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G9" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEC203",
        "courseName": "Electromagnetic Theory and Applications",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G9" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G9" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEC272",
        "courseName": "Analog and Digital Electronics Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "DE Lab" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "DE Lab" }
        ]
    },
    {
        "courseCode": "ESC201",
        "courseName": "Drinking Water Supply and Treatment",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C9" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C9" },
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C9" }
        ]
    },
    {
        "courseCode": "ESC202",
        "courseName": "Air Pollution",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C9" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C9" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C9" }
        ]
    },
    {
        "courseCode": "ESC251",
        "courseName": "Water Pollution Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "Water Chemistry Lab" },
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "Water Chemistry Lab" }
        ]
    },
    {
        "courseCode": "ESC252",
        "courseName": "Air and Noise Pollution Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "Air Lab" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "Air Lab" }
        ]
    },
    {
        "courseCode": "ESE201",
        "courseName": "Pollution Control and Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C1" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C1" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "FMC201",
        "courseName": "Colloids and Interfacial Phenomena",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC203",
        "courseName": "Physical Separation Processes for Coal and Minerals",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC251",
        "courseName": "Particle Technology Laboratory",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC252",
        "courseName": "Physical Separation Processes Laboratory",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FME221",
        "courseName": "Particle Technology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G8" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G8" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G8" }
        ]
    },
    {
        "courseCode": "MNC200",
        "courseName": "Elements of Mining",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G12" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G12" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MNC201",
        "courseName": "Rock Breakage",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-G12" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-G12" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MNC202",
        "courseName": "Mine Surveying",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G12" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G12" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MNC203",
        "courseName": "Mine Surveying Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNC204",
        "courseName": "Rock Breakage Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNE201",
        "courseName": "Introduction to Mining",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G12" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G12" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MEC201",
        "courseName": "Kinematics of Machines",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MEC202",
        "courseName": "Fluid Mechanics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G14" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G14" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MEC203",
        "courseName": "Applied Thermodynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G14" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G14" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MEC205",
        "courseName": "Thermodynamics and Fluid Mechanics Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "ThE lab" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "ThE lab" }
        ]
    },
    {
        "courseCode": "MEE201",
        "courseName": "Engineering Materials",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G14" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G14" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MMC202",
        "courseName": "Theory of Machines",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C4" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C4" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C4" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C4" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C7" }
        ]
    },
    {
        "courseCode": "MMC203",
        "courseName": "Design of Machine Elements",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C4" },
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C4" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C4" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C4" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C4" }
        ]
    },
    {
        "courseCode": "MMC205",
        "courseName": "Solid Mechanics and Theory of Machines Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "SOM lab" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "SOM lab" }
        ]
    },
    {
        "courseCode": "MME202",
        "courseName": "Mining Machinery",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G16" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G16" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "PEC201",
        "courseName": "Drilling Technology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "PET 1" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 1" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PEC202",
        "courseName": "Elements of Reservoir Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "PET 1" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "PET 1" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PEC204",
        "courseName": "Reservoir Engineering Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "PE Reservoir Engineering laboratory" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "PE Reservoir Engineering laboratory" }
        ]
    },
    {
        "courseCode": "PEC205",
        "courseName": "Drilling Fluids and Cementing Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "Drilling Fluids and Cement laboratory" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "Drilling Fluids and Cement laboratory" }
        ]
    },
    {
        "courseCode": "PEE201",
        "courseName": "Introduction to Petroleum Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 1" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 1" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PHC200",
        "courseName": "Waves and Acoustics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C20" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C20" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHC201",
        "courseName": "Classical Mechanics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C20" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C20" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHC202",
        "courseName": "Mathematical Physics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C20" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C20" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHC204",
        "courseName": "Waves and Acoustics Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "PHUG LAB 1" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "PHUG LAB 1" }
        ]
    },
    {
        "courseCode": "PHE200",
        "courseName": "Biomedical Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C20" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C20" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "GPC531",
        "courseName": "Geotechnical Modelling",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "GPC533",
        "courseName": "Seismic Hazard Zonation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "AGP Annexure Ground Floor" }
        ]
    },
    {
        "courseCode": "GPC535",
        "courseName": "Geotechnical Modelling Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CHC501",
        "courseName": "Advanced Transport Phenomena",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CHC502",
        "courseName": "Advanced Chemical Engineering Thermodynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CSC504",
        "courseName": "Computing Techniques and Mathematical Tools",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CSC505",
        "courseName": "High Performance Computer Architecture",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CSC507",
        "courseName": "Computing Techniques and Mathematical Tools Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "CSE LAB -IV" },
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "CSE LAB -IV" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "CSE LAB -IV" }
        ]
    },
    {
        "courseCode": "CEC501",
        "courseName": "Numerical Methods in Civil Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CEC503",
        "courseName": "Mechanics of Deformable Solids",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CED532",
        "courseName": "Slope and Retaining Structure",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "" }
        ]
    },
    {
        "courseCode": "ECC500",
        "courseName": "Advanced Communication Theory",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C4" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C4" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C4" }
        ]
    },
    {
        "courseCode": "ECC580",
        "courseName": "Mathematical and Simulation Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C4" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C4" },
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C4" }
        ]
    },
    {
        "courseCode": "ECC583",
        "courseName": "VLSI & Communication Systems Lab",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "VLSI Lab (202)" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "VLSI Lab (202)" },
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "VLSI Lab (202)" }
        ]
    },
    {
        "courseCode": "EEC502",
        "courseName": "Modelling of Electrical Machines",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "EEC512",
        "courseName": "Soft Computing Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C16" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C16" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C16" }
        ]
    },
    {
        "courseCode": "ESC501",
        "courseName": "Ecology and Environmental Microbiology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "ESC503",
        "courseName": "MATLAB Programming for Numerical Computation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC503",
        "courseName": "Numerical Methods & Computer Applications",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC504",
        "courseName": "Unit Operations in Extractive Metallurgy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MCC532",
        "courseName": "Fundamentals of Machine Learning",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-I-C15" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-I-C15" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-I-C15" }
        ]
    },
    {
        "courseCode": "MNC504",
        "courseName": "Risk and Workplace Safety Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "" },
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNC538",
        "courseName": "Mass Production Mining Technology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNC539",
        "courseName": "Computational Geomechanics and Ground Control",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "ME-MIN1" },
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "ME-MIN1" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "ME-MIN1" }
        ]
    },
    {
        "courseCode": "MEC508",
        "courseName": "Advanced Heat Transfer",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "MECH-G1" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "MECH-G1" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "MEC514",
        "courseName": "Advances in Machining",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "Mech G2" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G2" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G2" }
        ]
    },
    {
        "courseCode": "MEC594",
        "courseName": "Basics of Scientific Computing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "MME-C2" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "MME-C2" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "MME-C2" }
        ]
    },
    {
        "courseCode": "MMC502",
        "courseName": "Underground Mining Machineries",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "MECH-G1" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G1" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "MMC503",
        "courseName": "Application of MATLAB in Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" },
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "MMC504",
        "courseName": "Fluid Power Systems and Control",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "MME-212" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "MME-212" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "MME-212" }
        ]
    },
    {
        "courseCode": "PEC504",
        "courseName": "Advanced Production Technologies",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 4" },
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 4" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 4" }
        ]
    },
    {
        "courseCode": "CHC301",
        "courseName": "Separation Processes",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C13" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C13" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHC302",
        "courseName": "Chemical Kinetics and Reaction Engineering",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C13" },
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C13" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C13" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHC303",
        "courseName": "Process Design and Economics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C13" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C13" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHC304",
        "courseName": "Chemical Kinetics and Reaction Engineering Lab",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "CHE 431" },
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "CHE 431" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "CHE 431" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CHC305",
        "courseName": "Mass Transfer Lab",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "CHE 426" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "CHE 426" },
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "CHE 426" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CHO302",
        "courseName": "Industrial Safety and Hazards Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C13" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C13" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CSC206",
        "courseName": "Algorithm Design & Analysis",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G10" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G10" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G10" }
        ]
    },
    {
        "courseCode": "CSC210",
        "courseName": "Algorithm Design & Analysis Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "NLHC Computer Lab - III" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "NLHC Computer Lab - I" }
        ]
    },
    {
        "courseCode": "CSC301",
        "courseName": "Database Management Systems",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "NAC Hall" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "NAC Hall" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSC302",
        "courseName": "Compiler Design",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "NAC Hall" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "NAC Hall" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSC303",
        "courseName": "Database Management Systems Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "NLHC Computer Lab - I" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "NLHC Computer Lab - II" }
        ]
    },
    {
        "courseCode": "CSC304",
        "courseName": "Compiler Design Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "NLHC Computer Lab - II" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "NLHC Computer Lab - I" }
        ]
    },
    {
        "courseCode": "CSO303",
        "courseName": "Principles of Artificial Intelligence",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "NAC Hall" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "NAC Hall" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSO304",
        "courseName": "Digital Image Processing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "NAC Hall" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "NAC Hall" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CEC301",
        "courseName": "Structural Analysis - II",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C14" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C14" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C14" }
        ]
    },
    {
        "courseCode": "CEC302",
        "courseName": "Foundation Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C14" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C14" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C14" }
        ]
    },
    {
        "courseCode": "CEC303",
        "courseName": "Structural Engineering Laboratory",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "CEUG3" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "CEUG3" }
        ]
    },
    {
        "courseCode": "CEC304",
        "courseName": "Geotechnical Engineering Laboratory",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "CEUG4" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "CEUG4" }
        ]
    },
    {
        "courseCode": "CEO301",
        "courseName": "Reliability and Risk Assessment",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C14" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C14" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C14" }
        ]
    },
    {
        "courseCode": "CEO401",
        "courseName": "Flow and Transport through Porous Media",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C14" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C14" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C14" }
        ]
    },
    {
        "courseCode": "ECC301",
        "courseName": "Principles of Communication Systems",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G11" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G11" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "ECC302",
        "courseName": "Digital Signal Processing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G11" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G11" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "ECC303",
        "courseName": "VLSI Design",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G11" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G11" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "ECC304",
        "courseName": "Digital Signal Processing Lab",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "Analog Electronics & Devices Lab (208)" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "Analog Electronics & Devices Lab (208)" },
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "Analog Electronics & Devices Lab (208)" }
        ]
    },
    {
        "courseCode": "ECC305",
        "courseName": "Communication System Lab",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "Communication Lab (215)" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "Communication Lab (215)" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "Communication Lab (215)" }
        ]
    },
    {
        "courseCode": "ECD401",
        "courseName": "Antenna and Wave Propagation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G11" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G11" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "ECE201",
        "courseName": "Measurements and Instrumentations",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G11" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G11" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G11" }
        ]
    },
    {
        "courseCode": "EEC308",
        "courseName": "Electrical Machines - II",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G9" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G9" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEC309",
        "courseName": "Modern Control",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G9" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G9" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEC310",
        "courseName": "Power Electronics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G9" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G9" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEC375",
        "courseName": "Microprocessor and Microcontrollers Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "EEC376",
        "courseName": "Electrical Machines and Control Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "EEE202",
        "courseName": "Utilization of Electrical Energy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G9" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G9" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "EEO405",
        "courseName": "Industrial Automation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G9" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G9" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G9" }
        ]
    },
    {
        "courseCode": "ESC308",
        "courseName": "Environmental Geotechnology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C1" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C1" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "ESC309",
        "courseName": "Wastewater Treatment",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C1" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C1" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "ESC310",
        "courseName": "Environmental Impact Assessment",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C1" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C1" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "ESC355",
        "courseName": "Environmental Geotechnology Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "lecture hall no" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "lecture hall no" }
        ]
    },
    {
        "courseCode": "ESC356",
        "courseName": "Wastewater Engineering Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "Wastewater Lab" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "Wastewater Lab" }
        ]
    },
    {
        "courseCode": "ESO401",
        "courseName": "Climate Change Impacts on Water Resources",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C1" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C1" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "MSO403",
        "courseName": "Foundations of Management and Organizational Behaviour",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G8" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G8" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G8" }
        ]
    },
    {
        "courseCode": "FMC301",
        "courseName": "Coal and Mineral Process Equipment Selection",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C9" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C9" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C9" }
        ]
    },
    {
        "courseCode": "FMC302",
        "courseName": "Extractive Metallurgy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C9" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C9" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C9" }
        ]
    },
    {
        "courseCode": "FMC306",
        "courseName": "Coal and Mineral Process Equipment Selection Laboratory",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC351",
        "courseName": "Extractive Metallurgy Laboratory",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMD401",
        "courseName": "Powder Metallurgy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C9" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C9" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-C9" }
        ]
    },
    {
        "courseCode": "FMD402",
        "courseName": "Welding Metallurgy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C9" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C9" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C9" }
        ]
    },
    {
        "courseCode": "HSO403",
        "courseName": "Indian Society and Culture",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G12" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G12" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MNC300",
        "courseName": "Surface Mining",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G12" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G12" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MNC301",
        "courseName": "Mine Planning and Economics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G12" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G12" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MNC302",
        "courseName": "Computer Aided Mine Planning and Design",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "Texmin Dassault lab" },
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "Texmin Dassault lab" },
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "Texmin Dassault lab" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNC303",
        "courseName": "Mine Ventilation Practical - II",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "Mine Ventilation Lab" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "Mine Ventilation Lab" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Wednesday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "Mine Ventilation Lab" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "Mine Ventilation Lab" }
        ]
    },
    {
        "courseCode": "MNO301",
        "courseName": "Modern Surveying Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G8" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G8" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G8" }
        ]
    },
    {
        "courseCode": "MNO303",
        "courseName": "Underground Construction Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G12" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G12" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G12" }
        ]
    },
    {
        "courseCode": "MSO404",
        "courseName": "Introduction to Operations Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G7" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G7" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G7" }
        ]
    },
    {
        "courseCode": "MEC301",
        "courseName": "Machine Design",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G14" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G14" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MEC302",
        "courseName": "Machining and Machine Tools",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G14" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G14" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MEC303",
        "courseName": "Advanced Solid Mechanics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G14" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G14" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MEC304",
        "courseName": "Production Technology Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "" },
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MEC305",
        "courseName": "Machine Design Lab",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "MD lab" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "MD lab" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MEO302",
        "courseName": "Refrigeration and Air-conditioning",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G14" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G14" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G14" }
        ]
    },
    {
        "courseCode": "MED403",
        "courseName": "Power Plant",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G16" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G16" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "MMC301",
        "courseName": "Mineral Beneficiation Equipment",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G16" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G16" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "MMC302",
        "courseName": "Automation and Control in Mining Machineries",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G16" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G16" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "MMC303",
        "courseName": "Mine Electrical Technology Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "MINE ELEC LAB" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "MINE ELEC LAB" }
        ]
    },
    {
        "courseCode": "MMC304",
        "courseName": "Automation and Control Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "MINE ELEC LAB" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "MINE ELEC LAB" }
        ]
    },
    {
        "courseCode": "MMO301",
        "courseName": "Automobile Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G16" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G16" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "HSO321",
        "courseName": "Technology, Culture and Society",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 3" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 3" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 3" }
        ]
    },
    {
        "courseCode": "PEC301",
        "courseName": "Applied Petroleum Reservoir Engineering and Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 1" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "PET 1" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PEC302",
        "courseName": "Petroleum Production Operations",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 1" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "PET 1" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PEC303",
        "courseName": "Natural Gas Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "PET 1" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "PET 1" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PEC304",
        "courseName": "Petroleum Production Engineering Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "Petroleum Production Engineering Laboratory" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "Petroleum Production Engineering Laboratory" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PEC305",
        "courseName": "Process Engineering Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "Process Engineering Laboratory" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "Process Engineering Laboratory" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PEO404",
        "courseName": "Petroleum Resource Management and Project Evaluation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "PET 1" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 1" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "PET 1" }
        ]
    },
    {
        "courseCode": "PHC300",
        "courseName": "Thermal Physics Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "PHUG LAB-2" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "PHUG LAB-2" }
        ]
    },
    {
        "courseCode": "PHC301",
        "courseName": "Electronics Lab",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "PHUG LAB-2" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "PHUG LAB-2" }
        ]
    },
    {
        "courseCode": "PHC514",
        "courseName": "Statistical Mechanics",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C20" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C20" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C20" },
            { "day": "Friday", "startTime": "18:00", "endTime": "18:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHC515",
        "courseName": "Laser Physics and Technology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C20" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C20" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHO300",
        "courseName": "Sensors and Transducers",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C20" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C20" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHO302",
        "courseName": "Introduction to Astrophysics and Astronomy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G13" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G13" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "CHD401",
        "courseName": "Petrochemical Technology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C13" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C13" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHD411",
        "courseName": "Catalytic Reaction Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C13" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C13" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHD417",
        "courseName": "Membrane Science and Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C13" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C13" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHO401",
        "courseName": "Process Integration",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C13" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C13" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CHO402",
        "courseName": "Biofuels & Biomass Conversion Technology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C13" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C13" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C13" }
        ]
    },
    {
        "courseCode": "CSD510",
        "courseName": "Information Retrieval",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "NAC Hall" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "NAC Hall" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSD516",
        "courseName": "Optimization Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "NAC Hall" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "NAC Hall" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSO404",
        "courseName": "Cryptography",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "NAC Hall" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "NAC Hall" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSO504",
        "courseName": "Machine Learning",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "NAC Hall" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "NAC Hall" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CSO505",
        "courseName": "Soft Computing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "NAC Hall" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "NAC Hall" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "NAC Hall" }
        ]
    },
    {
        "courseCode": "CED401",
        "courseName": "Traffic Engineering and Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C1" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C1" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "CED542",
        "courseName": "Prestressed Concrete Structures",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C1" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C1" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C1" }
        ]
    },
    {
        "courseCode": "CEO524",
        "courseName": "Finite Element Method",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "CECR1" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "CECR1" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "CECR1" }
        ]
    },
    {
        "courseCode": "ECD403",
        "courseName": "Computer Networks",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G5" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G5" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G5" }
        ]
    },
    {
        "courseCode": "ECD405",
        "courseName": "Digital Systems Design using HDL",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-G5" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-G5" },
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-G5" }
        ]
    },
    {
        "courseCode": "ECD408",
        "courseName": "EMI/EMC",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C5" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C5" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C5" }
        ]
    },
    {
        "courseCode": "ECD415",
        "courseName": "Optical Communication",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G5" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G5" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G5" }
        ]
    },
    {
        "courseCode": "ECO501",
        "courseName": "Internet of Things",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-C4" },
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C4" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-C4" }
        ]
    },
    {
        "courseCode": "ECO506",
        "courseName": "Machine Learning",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G13" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G13" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "EED401",
        "courseName": "Power System Protection and Switchgear",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G6" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G6" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G6" }
        ]
    },
    {
        "courseCode": "EED403",
        "courseName": "Industrial Power Electronics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G6" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G6" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G6" }
        ]
    },
    {
        "courseCode": "EEO403",
        "courseName": "Digital Signal Processing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C2" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C2" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C2" }
        ]
    },
    {
        "courseCode": "EEO404",
        "courseName": "Renewable Energy Systems and Energy Audit",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C2" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C2" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C2" }
        ]
    },
    {
        "courseCode": "ESD401",
        "courseName": "Biodiversity Conservation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G16" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G16" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "ESD405",
        "courseName": "Climate Vulnerability and Risk Analysis",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G16" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G16" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "ESD502",
        "courseName": "Environmental Biotechnology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G16" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G16" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "ESD504",
        "courseName": "Green Engineering Concepts and Life Cycle Analysis",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C10" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C10" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C10" }
        ]
    },
    {
        "courseCode": "ESD511",
        "courseName": "Aerosols in the Atmosphere",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G16" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G16" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "ESO405",
        "courseName": "Cleaner Energy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G16" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G16" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G16" }
        ]
    },
    {
        "courseCode": "MSO301",
        "courseName": "Operations Research",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G6" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G6" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G6" }
        ]
    },
    {
        "courseCode": "MSO401",
        "courseName": "Principles of Economics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G6" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G6" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G6" }
        ]
    },
    {
        "courseCode": "MSO402",
        "courseName": "Introduction to Financial Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G6" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G6" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G6" }
        ]
    },
    {
        "courseCode": "FMD461",
        "courseName": "Computational Techniques and Modelling",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C5" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C5" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C5" }
        ]
    },
    {
        "courseCode": "FMD464",
        "courseName": "Mineral Policy and Economics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G8" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G8" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G8" }
        ]
    },
    {
        "courseCode": "FMO541",
        "courseName": "Characterization of Materials",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "FME-1" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "FME-1" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "FME-1" }
        ]
    },
    {
        "courseCode": "FMO545",
        "courseName": "Equipment Design",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "FME-1" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "FME-1" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "FME-1" }
        ]
    },
    {
        "courseCode": "FMO547",
        "courseName": "Additive Manufacturing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G8" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G8" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G8" }
        ]
    },
    {
        "courseCode": "MND400",
        "courseName": "Rock Excavation Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C6" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C6" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C6" }
        ]
    },
    {
        "courseCode": "MND401",
        "courseName": "Advanced Mine Ventilation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G13" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G13" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "MND402",
        "courseName": "Open Pit Slope Analysis and Design",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C6" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C6" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C6" }
        ]
    },
    {
        "courseCode": "MND403",
        "courseName": "Geospatial Technology in Mining",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G13" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G13" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "MND404",
        "courseName": "Mine System Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G13" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G13" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "MND405",
        "courseName": "Mine Safety Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G13" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G13" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "MND406",
        "courseName": "Mine Environmental Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G13" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G13" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "MED404",
        "courseName": "Digital Manufacturing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G2" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G2" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G2" }
        ]
    },
    {
        "courseCode": "MED539",
        "courseName": "Fundamentals of Aerodynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G2" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G2" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G2" }
        ]
    },
    {
        "courseCode": "MED540",
        "courseName": "Fundamentals of Aeroacoustics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G2" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G2" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G2" }
        ]
    },
    {
        "courseCode": "MEO528",
        "courseName": "Robotics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G2" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G2" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G2" }
        ]
    },
    {
        "courseCode": "MEO579",
        "courseName": "Computational Fluid Dynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G2" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G2" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G2" }
        ]
    },
    {
        "courseCode": "MED401",
        "courseName": "Energy Conversion Equipment",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "MED402",
        "courseName": "Optimization Theory",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G1" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G1" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "MED549",
        "courseName": "Cryogenic Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "MECH-G1" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "MEO534",
        "courseName": "Automation and Control",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G1" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G1" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "MECH-G1" }
        ]
    },
    {
        "courseCode": "HSD405",
        "courseName": "Introduction to Environmental Humanities",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G8" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G8" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G8" }
        ]
    },
    {
        "courseCode": "HSD559",
        "courseName": "Analytical Philosophy",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 3" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 3" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 3" }
        ]
    },
    {
        "courseCode": "HSO407",
        "courseName": "Experience Psychology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G1" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G1" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G1" }
        ]
    },
    {
        "courseCode": "HSO408",
        "courseName": "Judgement and Decision Making",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 3" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 3" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 3" }
        ]
    },
    {
        "courseCode": "PED401",
        "courseName": "Offshore Drilling and Petroleum Production Practices",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "PET 2" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "PET 2" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 2" }
        ]
    },
    {
        "courseCode": "PED402",
        "courseName": "Enhanced Oil Recovery Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "PET 2" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "PET 2" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "PET 2" }
        ]
    },
    {
        "courseCode": "PEO401",
        "courseName": "Petroleum Environment, Health and Safety Practices",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 2" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 2" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 2" }
        ]
    },
    {
        "courseCode": "PEO402",
        "courseName": "Well Performance",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 2" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 2" },
            { "day": "Friday", "startTime": "11:00", "endTime": "11:50", "venue": "PET 2" }
        ]
    },
    {
        "courseCode": "PEO406",
        "courseName": "Reservoir Geomechanics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 2" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 2" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "PET 2" }
        ]
    },
    {
        "courseCode": "PHD501",
        "courseName": "Advanced Quantum Mechanics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C15" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C15" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C15" }
        ]
    },
    {
        "courseCode": "PHD509",
        "courseName": "Advanced Condensed Matter Physics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C19" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C19" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-C19" }
        ]
    },
    {
        "courseCode": "PHO400",
        "courseName": "Nanoelectronics and Nanophotonics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C15" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C15" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-C15" }
        ]
    },
    {
        "courseCode": "PHO504",
        "courseName": "Optoelectronic Materials and Devices",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C15" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C15" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-C15" }
        ]
    },
    {
        "courseCode": "GLC502",
        "courseName": "Applied Geochemistry",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "AGL-1" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "AGL-1" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "AGL-1" }
        ]
    },
    {
        "courseCode": "GLC503",
        "courseName": "Methods of Structural Geology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "AGL-1" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "AGL-1" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "AGL-1" }
        ]
    },
    {
        "courseCode": "GLC504",
        "courseName": "Micropaleontology and Vertebrate Palaeontology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "AGL-1" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "AGL-1" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "AGL-1" }
        ]
    },
    {
        "courseCode": "GLC506",
        "courseName": "Mineralogy and Geochemistry Practical",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "Petrology Lab" },
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "Petrology Lab" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "Petrology Lab" }
        ]
    },
    {
        "courseCode": "GLC507",
        "courseName": "Methods of Structural Geology Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "AGL-2" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "AGL-2" }
        ]
    },
    {
        "courseCode": "GLC508",
        "courseName": "Micropaleontology and Vertebrate Paleontology Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "Paleontology Lab" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "Paleontology Lab" }
        ]
    },
    {
        "courseCode": "GLO532",
        "courseName": "Environmental Geology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "AGL-1" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "AGL-1" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "AGL-1" }
        ]
    },
    {
        "courseCode": "GPC501",
        "courseName": "Solid Earth Geophysics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "AGP 516" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "AGP 516" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "AGP 516" }
        ]
    },
    {
        "courseCode": "GPC502",
        "courseName": "Gravity Method",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "Annexe 102" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "Annexe 102" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "Annexe 102" }
        ]
    },
    {
        "courseCode": "GPC504",
        "courseName": "Mathematical Functional Analysis",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "AGP Annexure Ground Floor" }
        ]
    },
    {
        "courseCode": "GPC505",
        "courseName": "Gravity Method Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "AGP Annexure Ground Floor" }
        ]
    },
    {
        "courseCode": "GPC507",
        "courseName": "Mathematical Functional Analysis Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "Geophysical Inversion lab" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "Geophysical Inversion lab" }
        ]
    },
    {
        "courseCode": "GPE202",
        "courseName": "Geophysical Prospecting",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G13" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G13" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G13" }
        ]
    },
    {
        "courseCode": "GPE203",
        "courseName": "Geophysical Prospecting Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "Seismic data processing Lab" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "Seismic data processing Lab" }
        ]
    },
    {
        "courseCode": "MCC301",
        "courseName": "Number Theory and Cryptography",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G15" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G15" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCC302",
        "courseName": "GPU Computing Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "NLHC Computer Lab - I" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "NLHC Computer Lab - I" }
        ]
    },
    {
        "courseCode": "MCC502",
        "courseName": "Differential Equations",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G15" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G15" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCD541",
        "courseName": "GPU Computing",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G15" },
            { "day": "Tuesday", "startTime": "17:00", "endTime": "17:50", "venue": "LC-II-G15" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCO403",
        "courseName": "Graph Algorithms",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-II-G15" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G15" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCO533",
        "courseName": "Numerical Linear Algebra",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "LC-I-C16" },
            { "day": "Thursday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-I-C16" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "LC-I-C16" }
        ]
    },
    {
        "courseCode": "GLC518",
        "courseName": "Principles and Applications of Geostatistics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "AGL-3" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "AGL-3" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "AGL-3" }
        ]
    },
    {
        "courseCode": "GLC519",
        "courseName": "Engineering Geology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "AGL-1" },
            { "day": "Wednesday", "startTime": "09:00", "endTime": "09:50", "venue": "AGL-1" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "AGL-3" }
        ]
    },
    {
        "courseCode": "GLC520",
        "courseName": "Hydrogeology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "AGL-3" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "AGL-3" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "AGL-3" }
        ]
    },
    {
        "courseCode": "GLC524",
        "courseName": "Principles and Applications of Geostatistics Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "AGL-2" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "AGL-2" }
        ]
    },
    {
        "courseCode": "GLC525",
        "courseName": "Engineering Geology and Hydrogeology Practical",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "AGL-3" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "AGL-3" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "AGL-3" }
        ]
    },
    {
        "courseCode": "GLD522",
        "courseName": "Coalbed Methane, Shale Gas and Gas Hydrate Exploration",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "AGL-3" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "AGL-3" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "AGL-3" }
        ]
    },
    {
        "courseCode": "GLO523",
        "courseName": "Atmosphere, Ocean and Climate Dynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "AGL-3" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "AGL-3" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "AGL-3" }
        ]
    },
    {
        "courseCode": "GPC516",
        "courseName": "Geophysical Inversion",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "AGP 516" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "AGP 516" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "AGP 516" }
        ]
    },
    {
        "courseCode": "GPC517",
        "courseName": "Seismic Data Processing and Interpretation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Wednesday", "startTime": "09:00", "endTime": "09:50", "venue": "AGP Annexure Ground Floor" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "AGP Annexure Ground Floor" }
        ]
    },
    {
        "courseCode": "GPC518",
        "courseName": "Geophysical Inversion Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "Geophysical Inversion lab" },
            { "day": "Friday", "startTime": "16:00", "endTime": "16:50", "venue": "Geophysical Inversion lab" }
        ]
    },
    {
        "courseCode": "GPC519",
        "courseName": "Seismic Data Processing and Interpretation  Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "Seismic data processing Lab" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "Seismic data processing Lab" }
        ]
    },
    {
        "courseCode": "GPD501",
        "courseName": "Geothermics and Geodynamics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "AGP 516" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "AGP 516" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "AGP 516" }
        ]
    },
    {
        "courseCode": "GPD503",
        "courseName": "Image Processing and Geographic Information System",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "AGP Annexure 1st Floor" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "AGP Annexure 1st Floor" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "AGP Annexure 1st Floor" }
        ]
    },
    {
        "courseCode": "GPO501",
        "courseName": "Groundwater Geophysics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "AGP Annexure 1st Floor" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "AGP Annexure 1st Floor" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "AGP Annexure 1st Floor" }
        ]
    },
    {
        "courseCode": "MCC503",
        "courseName": "Numerical Methods",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G15" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G15" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCC506",
        "courseName": "Numerical Methods Practical",
        "ltp": "0-0-3",
        "credits": calculateCredits("0-0-3"),
        "slots": [
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "NLHC Computer Lab - III" },
            { "day": "Friday", "startTime": "09:00", "endTime": "09:50", "venue": "NLHC Computer Lab - III" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "NLHC Computer Lab - III" }
        ]
    },
    {
        "courseCode": "MCD516",
        "courseName": "Industrial Statistics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G15" },
            { "day": "Thursday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G15" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCD539",
        "courseName": "Big Data",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G15" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "LC-II-G15" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCO401",
        "courseName": "Partial Differential Equations",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G15" },
            { "day": "Tuesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G15" },
            { "day": "Wednesday", "startTime": "11:00", "endTime": "11:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "MCO502",
        "courseName": "Optimization Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G15" },
            { "day": "Wednesday", "startTime": "09:00", "endTime": "09:50", "venue": "LC-II-G15" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "LC-II-G15" }
        ]
    },
    {
        "courseCode": "PHD506",
        "courseName": "Characterization Techniques",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C20" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C20" },
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C20" }
        ]
    },
    {
        "courseCode": "PHD510",
        "courseName": "Quantum Computation and Information",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C19" },
            { "day": "Thursday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C19" },
            { "day": "Friday", "startTime": "08:00", "endTime": "08:50", "venue": "LC-II-C19" }
        ]
    },
    {
        "courseCode": "GPC201",
        "courseName": "Introduction to Rock Physics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "" }
        ]
    },
    {
        "courseCode": "GPC203",
        "courseName": "Lab on Rock Physics",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "GPC508",
        "courseName": "Earthquake Seismology",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Tuesday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Wednesday", "startTime": "18:00", "endTime": "18:50", "venue": "" }
        ]
    },
    {
        "courseCode": "GLE201",
        "courseName": "Geology for Engineering and Sciences",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "12:00", "endTime": "12:50", "venue": "" },
            { "day": "Tuesday", "startTime": "12:00", "endTime": "12:50", "venue": "" },
            { "day": "Wednesday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "ESC507",
        "courseName": "Municipal Solid Waste Management",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Friday", "startTime": "12:00", "endTime": "12:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MCC505",
        "courseName": "Probability & Statistics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Wednesday", "startTime": "14:00", "endTime": "14:50", "venue": "" }
        ]
    },
    {
        "courseCode": "FMC205",
        "courseName": "Thermodynamics and Kinetics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Tuesday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Friday", "startTime": "10:00", "endTime": "10:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNC205",
        "courseName": "Rock Mechanics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MNC209",
        "courseName": "Rock Mechanics Practical",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "HSI500",
        "courseName": "Research and Technical Communication",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CEI101",
        "courseName": "Engineering Graphics",
        "ltp": "1-0-3",
        "credits": calculateCredits("1-0-3"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Thursday", "startTime": "18:00", "endTime": "18:50", "venue": "" },
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "CYI101",
        "courseName": "Chemistry",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Wednesday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" }
        ]
    },
    {
        "courseCode": "EEI101",
        "courseName": "Basics of Electrical Engineering",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MSI101",
        "courseName": "Engineering Economics and Finance",
        "ltp": "2-0-0",
        "credits": calculateCredits("2-0-0"),
        "slots": [
            { "day": "Thursday", "startTime": "11:00", "endTime": "11:50", "venue": "" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC501",
        "courseName": "Classical Mechanics and Special Theory of Relativity",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Tuesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Wednesday", "startTime": "17:00", "endTime": "17:50", "venue": "" },
            { "day": "Thursday", "startTime": "17:00", "endTime": "17:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC502",
        "courseName": "Methods of Mathematical Physics",
        "ltp": "3-1-0",
        "credits": calculateCredits("3-1-0"),
        "slots": [
            { "day": "Monday", "startTime": "16:00", "endTime": "16:50", "venue": "" },
            { "day": "Tuesday", "startTime": "14:00", "endTime": "14:50", "venue": "" },
            { "day": "Thursday", "startTime": "16:00", "endTime": "16:50", "venue": "" },
            { "day": "Friday", "startTime": "17:00", "endTime": "17:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC503",
        "courseName": "Optics and Optical Instrumentation",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Monday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Tuesday", "startTime": "08:00", "endTime": "08:50", "venue": "" },
            { "day": "Wednesday", "startTime": "08:00", "endTime": "08:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC504",
        "courseName": "Electronics",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC505",
        "courseName": "Numerical Methods and Computer Programming",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Tuesday", "startTime": "16:00", "endTime": "16:50", "venue": "" },
            { "day": "Wednesday", "startTime": "16:00", "endTime": "16:50", "venue": "" },
            { "day": "Friday", "startTime": "15:00", "endTime": "15:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC506",
        "courseName": "Experimental Physics - I",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Monday", "startTime": "10:00", "endTime": "10:50", "venue": "" },
            { "day": "Monday", "startTime": "09:00", "endTime": "09:50", "venue": "" }
        ]
    },
    {
        "courseCode": "PHC507",
        "courseName": "Experimental Physics - II",
        "ltp": "0-0-2",
        "credits": calculateCredits("0-0-2"),
        "slots": [
            { "day": "Thursday", "startTime": "09:00", "endTime": "09:50", "venue": "" },
            { "day": "Thursday", "startTime": "10:00", "endTime": "10:50", "venue": "" }
        ]
    },
    {
        "courseCode": "MSC501",
        "courseName": "Management Principles & Practices",
        "ltp": "3-0-0",
        "credits": calculateCredits("3-0-0"),
        "slots": [
            { "day": "Wednesday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Thursday", "startTime": "15:00", "endTime": "15:50", "venue": "" },
            { "day": "Friday", "startTime": "14:00", "endTime": "14:50", "venue": "" }
        ]
    }
];
