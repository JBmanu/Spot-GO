import { USER_PROTO_POSITION } from "../common";

export function setupCenterToUserPositionButton(map, buttonEl) {
    function checkUserVisibility() {
        if (!USER_PROTO_POSITION) return;

        const mapBounds = map.getBounds();

        if (mapBounds.contains(USER_PROTO_POSITION)) {
            buttonEl.classList.remove('visible');
        } else {
            buttonEl.classList.add('visible');
        }
    }

    function centerMapToUserPosition(e) {
        e.preventDefault();
        e.stopPropagation();
        map.flyTo(USER_PROTO_POSITION, 15);
    }

    map.on('move', checkUserVisibility);

    buttonEl.removeEventListener('click', centerMapToUserPosition);
    buttonEl.addEventListener('click', centerMapToUserPosition);
}