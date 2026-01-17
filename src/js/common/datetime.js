
export function formatDate(dateInput) {
    if (!dateInput) return "";

    let dateObj;

    if (dateInput && typeof dateInput.seconds === 'number') {
        dateObj = new Date(dateInput.seconds * 1000);
    }
    else if (dateInput instanceof Date) {
        dateObj = dateInput;
    }
    else {
        dateObj = new Date(dateInput);
    }
    if (isNaN(dateObj.getTime())) {
        return "";
    }

    return dateObj.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '-');
}
