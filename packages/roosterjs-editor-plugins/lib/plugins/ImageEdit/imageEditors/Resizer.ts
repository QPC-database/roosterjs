import DragAndDropContext, { X, Y } from '../types/DragAndDropContext';
import DragAndDropHandler from '../../../pluginUtils/DragAndDropHandler';
import ImageEditInfo, { ResizeInfo } from '../types/ImageEditInfo';
import ImageHtmlOptions from '../types/ImageHtmlOptions';
import rotateCoordinate from './rotateCoordinate';
import { ImageEditElementClass } from '../types/ImageEditElementClass';

const RESIZE_HANDLE_SIZE = 7;
const RESIZE_HANDLE_MARGIN = 3;
const Xs: X[] = ['w', '', 'e'];
const Ys: Y[] = ['s', '', 'n'];

/**
 * The resize drag and drop handler
 */
const Resizer: DragAndDropHandler<DragAndDropContext, ResizeInfo> = {
    onDragStart: ({ editInfo }) => ({ ...editInfo }),
    onDragging: ({ x, y, editInfo, options }, e, base, deltaX, deltaY) => {
        const ratio = base.width > 0 && base.height > 0 ? (base.width * 1.0) / base.height : 0;

        [deltaX, deltaY] = rotateCoordinate(deltaX, deltaY, editInfo.angle);

        const horizontalOnly = x == '';
        const verticalOnly = y == '';
        const shouldPreserveRatio =
            !(horizontalOnly || verticalOnly) && (options.preserveRatio || e.shiftKey);
        let newWidth = horizontalOnly
            ? base.width
            : Math.max(base.width + deltaX * (x == 'w' ? -1 : 1), options.minWidth);
        let newHeight = verticalOnly
            ? base.height
            : Math.max(base.height + deltaY * (y == 'n' ? -1 : 1), options.minHeight);

        if (shouldPreserveRatio && ratio > 0) {
            newHeight = Math.min(newHeight, newWidth / ratio);
            newWidth = Math.min(newWidth, newHeight * ratio);

            if (ratio > 0) {
                if (newWidth < newHeight * ratio) {
                    newWidth = newHeight * ratio;
                } else {
                    newHeight = newWidth / ratio;
                }
            }
        }

        editInfo.width = newWidth;
        editInfo.height = newHeight;

        return true;
    },
};

/**
 * @internal
 */
export default Resizer;

/**
 * @internal
 * Double check if the changed size can satisfy current width of container.
 * When resize an image and preserve ratio, its size can be limited by the size of container.
 * So we need to check the actual size and calculate the size again
 * @param editInfo Edit info of the image
 * @param preserveRatio Whether w/h ratio need to be preserved
 * @param actualWidth Actual width of the image after resize
 * @param actualHeight Actual height of the image after resize
 */
export function doubleCheckResize(
    editInfo: ImageEditInfo,
    preserveRatio: boolean,
    actualWidth: number,
    actualHeight: number
) {
    let { width, height } = editInfo;
    const ratio = height > 0 ? width / height : 0;

    actualWidth = Math.floor(actualWidth);
    actualHeight = Math.floor(actualHeight);
    width = Math.floor(width);
    height = Math.floor(height);

    editInfo.width = actualWidth;
    editInfo.height = actualHeight;

    if (preserveRatio && ratio > 0 && (width !== actualWidth || height !== actualHeight)) {
        if (actualWidth < width) {
            editInfo.height = actualWidth / ratio;
        } else {
            editInfo.width = actualHeight * ratio;
        }
    }
}

/**
 * @internal
 * Get HTML for resize handles at the corners
 */
export function getCornerResizeHTML({ borderColor: resizeBorderColor }: ImageHtmlOptions): string {
    return Xs.map(x =>
        Ys.map(y =>
            (x == '') == (y == '') ? getResizeHandleHTML(x, y, resizeBorderColor) : ''
        ).join('')
    ).join('');
}

/**
 * @internal
 * Get HTML for resize handles on the sides
 */
export function getSideResizeHTML({ borderColor: resizeBorderColor }: ImageHtmlOptions): string {
    return Xs.map(x =>
        Ys.map(y =>
            (x == '') != (y == '') ? getResizeHandleHTML(x, y, resizeBorderColor) : ''
        ).join('')
    ).join('');
}

function getResizeHandleHTML(x: X, y: Y, borderColor: string): string {
    const leftOrRight = x == 'w' ? 'left' : 'right';
    const topOrBottom = y == 'n' ? 'top' : 'bottom';
    const leftOrRightValue = x == '' ? '50%' : '0px';
    const topOrBottomValue = y == '' ? '50%' : '0px';
    const direction = y + x;
    const context = `data-x="${x}" data-y="${y}"`;

    return x == '' && y == ''
        ? `<div style="position:absolute;left:0;right:0;top:0;bottom:0;border:solid 1px ${borderColor};pointer-events:none;"></div>`
        : `
    <div style="position:absolute;${leftOrRight}:${leftOrRightValue};${topOrBottom}:${topOrBottomValue}">
        <div class="${ImageEditElementClass.ResizeHandle}" ${context} style="position:relative;width:${RESIZE_HANDLE_SIZE}px;height:${RESIZE_HANDLE_SIZE}px;background-color: ${borderColor};cursor:${direction}-resize;${topOrBottom}:-${RESIZE_HANDLE_MARGIN}px;${leftOrRight}:-${RESIZE_HANDLE_MARGIN}px">
        </div>
    </div>`;
}
