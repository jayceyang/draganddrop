export function setUpDragAndDrop(element, overElements, completion) {
    // console.log('platform: ', navigator.userAgent);

    const findClosestOverlapElementHandler = (ofElement, fromElements) => {
        let distances = [];
        const overlapElements = fromElements.filter(element => {
            if (element === ofElement) {
                return false;
            }
            const rect1 = ofElement.getBoundingClientRect();
            const rect2 = element.getBoundingClientRect();
            const overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
            if (overlap) {
                let distance = Math.hypot(rect1.x - parseInt(rect2.x), rect1.y - parseInt(rect2.y));
                distances.push(parseInt(distance));
            }
            return overlap;
        });
        if (distances.length === 0) {
            return undefined;
        }
        let closestIndex = distances.indexOf(Math.min(...distances));
        if (overlapElements.length > 0 && closestIndex !== undefined) {
            return overlapElements[closestIndex];
        }
        return undefined;
    };

    const startHandler = (target, entity) => {
        target.dataset.startX = entity.pageX;
        target.dataset.startY = entity.pageY;

        target.classList.add('drag');
        target.style.zIndex = 1;
    };

    const moveHandler = (target, entity) => {
        // if (Math.abs(target.dataset.currentX - entity.pageX) < 5 && Math.abs(target.dataset.currentY - entity.pageY) < 5) {
        //     return;
        // }
        // target.dataset.currentX = entity.pageX;
        // target.dataset.currentY = entity.pageY;
        const x = entity.pageX - (parseFloat(target.dataset.startX) || 0);
        const y = entity.pageY - (parseFloat(target.dataset.startY) || 0);
        // console.log(`ondrag x: ${entity.pageX} y: ${entity.pageY}`);
        target.style.transform = `translate(${x}px, ${y}px)`;

        const overElement = findClosestOverlapElementHandler(element, overElements);
        if (!overElement) {
            return;
        }
        // console.log('overElement: ', overElement);
        overElements.forEach(elementAnother => {
            if (elementAnother === element) {
                return;
            }
            if (elementAnother === overElement) {
                elementAnother.classList.add('over');
            } else {
                elementAnother.classList.remove('over');
            }
        });
    };

    const endHandler = (target) => {
        target.removeAttribute('style');
        target.removeAttribute('data-start-x');
        target.removeAttribute('data-start-y');

        const dragElement = target;
        const overElement = overElements.find(x => x.classList.contains('over'));
        if (!dragElement || !overElement) {
            return;
        }
        // console.log('dragElement: ', dragElement);
        // console.log('overElement: ', overElement);
        if (dragElement) {
            dragElement.classList.remove('drag');
        }
        if (overElement) {
            overElement.classList.remove('over');
        }

        completion({ dragElement: dragElement, overElement: overElement });
    };

    if ('ontouchstart' in document.documentElement && !navigator.userAgent.includes('macOS')) {
        console.log('Using HTML Touch API');
        [...element.children].forEach(child => {
            const redirect = event => {
                event.preventDefault();
                event.stopPropagation();
                element.dispatchEvent(new event.constructor(event.type, event));
            };
            child.ontouchstart = redirect;
            child.ontouchmove = redirect;
            child.ontouchend = redirect;
            child.ontouchcancel = redirect;
        });
        element.ontouchstart = event => {
            const touches = event.targetTouches;
            if (!touches || touches.length === 0) {
                console.log('ontouchstart no touches');
                return;
            }
            const target = event.target;
            // console.log('ontouchstart target: ', target);
            const touch = touches[0];
            startHandler(target, touch);
        };
        element.ontouchmove = event => {
            event.preventDefault();
            const touches = event.targetTouches;
            if (!touches || touches.length === 0) {
                console.log('ontouchmove no touches');
                return;
            }
            const target = event.target;
            // console.log('ontouchmove target: ', target);
            const touch = touches[0];
            moveHandler(target, touch);
        };
        element.ontouchend = event => {
            const target = event.target;
            // console.log('ontouchend target: ', target);
            endHandler(target);
        };
        element.ontouchcancel = element.ontouchend;
    } else {
        console.log('Using HTML Drag and Drop API');
        // [...element.children].forEach(child => {
        //     element.setAttribute('draggable', false);
        //     const redirect = event => {
        //         event.preventDefault();
        //         event.stopPropagation();
        //         element.dispatchEvent(new event.constructor(event.type, event));
        //     };
        //     child.ondragstart = redirect;
        //     child.ondrag = redirect;
        //     child.ondragend = redirect;
        // });

        element.setAttribute('draggable', true);

        element.ondragstart = event => {
            const target = event.target;
            // console.log('ondragstart target: ', target);
            event.dataTransfer.effectAllowed = 'none';
            event.dataTransfer.setData("text/html", event.target.outerHTML);
            // const copy = target.cloneNode(true);
            // copy.style.display = 'none';
            // document.body.appendChild(copy);
            // event.dataTransfer.setDragImage(copy, 0, 0);
            startHandler(target, event);
        };
        element.ondrag = event => {
            event.preventDefault();
            if (event.pageX === 0 && event.pageY === 0) {
                return;
            }
            const target = event.target;
            // console.log('ondrag target: ', target);
            moveHandler(target, event);
        };
        element.ondragend = event => {
            const target = event.target;
            // console.log('ondragend target: ', target);
            endHandler(target);
        };
        element.ondragexit = element.ondragend;
    }
}