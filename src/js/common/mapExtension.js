import { USER_PROTO_POSITION } from "../common";

export function setupCenterToUserPositionButton(map, buttonEl) {
    const iconEl = buttonEl.querySelector('img');    
    const iconDefault = "../../assets/icons/map/Target.svg";
    const iconFilled = "../../assets/icons/map/TargetFilled.svg";

    function updateIconVisibility() {
        if (!USER_PROTO_POSITION || !iconEl) return;

        const mapBounds = map.getBounds();

        if (mapBounds.contains(USER_PROTO_POSITION)) {
            iconEl.src = iconFilled;
        } else {
            iconEl.src = iconDefault;
        }
    }

    function centerMapToUserPosition(e) {
        e.preventDefault();
        e.stopPropagation();
        if (USER_PROTO_POSITION) {
            map.flyTo(USER_PROTO_POSITION, 15);
        }
    }

    buttonEl.classList.add('visible'); 

    map.on('move', updateIconVisibility);
    map.on('zoomend', updateIconVisibility);

    updateIconVisibility();

    buttonEl.removeEventListener('click', centerMapToUserPosition);
    buttonEl.addEventListener('click', centerMapToUserPosition);
}

export function setupCenterToSpotPositionButton(map, buttonEl, getSpotPosition) {
    const iconEl = buttonEl.querySelector('img');
    const iconDefault = "../assets/icons/map/Target.svg";
    const iconFilled = "../assets/icons/map/TargetFilled.svg";

    function updateIconState() {
        const spotPos = getSpotPosition();
        if (!spotPos || !iconEl) return;

        const mapBounds = map.getBounds();

        if (mapBounds.contains(spotPos)) {
            iconEl.src = iconFilled;
        } else {
            iconEl.src = iconDefault;
        }
    }

    function centerMapToSpot(e) {
        e.preventDefault();
        e.stopPropagation();
        const spotPos = getSpotPosition();
        if (spotPos) {
            map.flyTo(spotPos, 15);
        }
    }

    buttonEl.classList.add('visible');

    map.on('move', updateIconState);
    map.on('zoomend', updateIconState);

    updateIconState();

    buttonEl.removeEventListener('click', centerMapToSpot);
    buttonEl.addEventListener('click', centerMapToSpot);
}